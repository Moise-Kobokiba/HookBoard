export type WorkflowNodeType = 'webhook' | 'request' | 'response'
export type ExecutionState = 'idle' | 'queued' | 'running' | 'success' | 'error'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestDefinition { method: HttpMethod; url: string; queryParams: Record<string,string>; headers: Record<string,string>; body?: string }
export interface ResponseDefinition { status: number; statusText: string; headers: Record<string,string>; body: string; durationMs: number }
export interface WebhookNodeData { kind:'webhook'; label:string; method: HttpMethod; endpoint:string; samplePayload:string; executionState:ExecutionState }
export interface RequestNodeData { kind:'request'; label:string; request:RequestDefinition; response?:ResponseDefinition; executionState:ExecutionState }
export interface ResponseNodeData { kind:'response'; label:string; response?:ResponseDefinition; executionState:ExecutionState }
export type WorkflowNodeData = WebhookNodeData | RequestNodeData | ResponseNodeData
export interface WorkflowNode { id:string; type:'workflow'; position:{x:number;y:number}; data:WorkflowNodeData }
export interface WorkflowEdge { id:string; source:string; target:string; animated?:boolean }
export interface Workflow { id:string; name:string; nodes:WorkflowNode[]; edges:WorkflowEdge[]; createdAt:string; updatedAt:string }
export interface ExecutionEvent { id:string; workflowId:string; startedAt:string; completedAt?:string; status:'running'|'success'|'error'; trigger?:string; durationMs?:number; response?:ResponseDefinition; error?:string }
export interface ExecutionResult { status:'success'|'error'; response?:ResponseDefinition; events:ExecutionEvent[]; error?:string }
export interface ValidationError { code:string; message:string; nodeId?:string }
export interface ExecutionContext { payload:Record<string,unknown> }

export const samplePayload = '{\n  "event": "order.created",\n  "order_id": "ORD-1042",\n  "customer": "Demo Customer",\n  "amount": 1499,\n  "currency": "ZAR"\n}'
export function createDefaultWorkflow(): Workflow { const now=new Date().toISOString(); return {id:'default-workflow',name:'Untitled Playground',createdAt:now,updatedAt:now,nodes:[{id:'webhook',type:'workflow',position:{x:120,y:80},data:{kind:'webhook',label:'Webhook',method:'POST',endpoint:'/hooks/demo',samplePayload,executionState:'idle'}},{id:'request',type:'workflow',position:{x:120,y:240},data:{kind:'request',label:'HTTP Request',request:{method:'POST',url:'https://api.example.com/orders',queryParams:{},headers:{'content-type':'application/json'},body:'{\n  "order_id": "{{order_id}}"\n}'},executionState:'idle'}},{id:'response',type:'workflow',position:{x:120,y:400},data:{kind:'response',label:'Response',executionState:'idle'}}],edges:[{id:'e1-2',source:'webhook',target:'request'},{id:'e2-3',source:'request',target:'response'}]} }
export function isWorkflow(value: unknown): value is Workflow { if(!value||typeof value!=='object') return false; const w=value as Workflow; return typeof w.id==='string'&&typeof w.name==='string'&&Array.isArray(w.nodes)&&Array.isArray(w.edges)&&w.nodes.every(n=>typeof n.id==='string'&&n.position&&n.data?.kind) }
export function validateWorkflow(workflow: Workflow): ValidationError[] {
  const errors: ValidationError[] = []
  const ids = new Set(workflow.nodes.map((node) => node.id))

  workflow.nodes.forEach((node) => {
    if (node.data.kind !== 'request') return

    if (!node.data.request.url) {
      errors.push({ code: 'missing_url', message: 'Add a request URL before running.', nodeId: node.id })
      return
    }

    try {
      const url = new URL(node.data.request.url)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol')
    } catch {
      errors.push({ code: 'invalid_url', message: 'Request URL must be a valid HTTP or HTTPS URL.', nodeId: node.id })
    }

    if (node.data.request.body) {
      try {
        JSON.parse(node.data.request.body.replace(/{{[^}]+}}/g, '"demo"'))
      } catch {
        errors.push({ code: 'invalid_json', message: 'Request body contains invalid JSON.', nodeId: node.id })
      }
    }
  })

  workflow.edges.forEach((edge) => {
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      errors.push({ code: 'broken_edge', message: 'Workflow contains a connection to a missing node.' })
    }
  })

  return errors
}
export function serializeWorkflow(workflow:Workflow):string{return JSON.stringify(workflow,null,2)}
export function parseWorkflow(raw:string):Workflow { const value=JSON.parse(raw) as unknown; if(!isWorkflow(value)) throw new Error('Invalid Hookboard workflow file.'); return value }
export interface WorkflowStorage { save(workflow:Workflow):Promise<void>; load(id:string):Promise<Workflow|null>; delete(id:string):Promise<void> }
export const workflowStorage:WorkflowStorage={async save(w){if(typeof window!=='undefined') window.localStorage.setItem(`hookboard:${w.id}`,JSON.stringify(w))},async load(id){if(typeof window==='undefined')return null; const raw=window.localStorage.getItem(`hookboard:${id}`); if(!raw)return null; try{return parseWorkflow(raw)}catch{return null}},async delete(id){if(typeof window!=='undefined')window.localStorage.removeItem(`hookboard:${id}`)}}
export function mockRequest(request:RequestDefinition,context:ExecutionContext):ResponseDefinition { const start=performance.now(); const body=JSON.stringify({success:true,id:'demo_123',status:'created',received:context.payload}); return {status:200,statusText:'OK',headers:{'content-type':'application/json'},body,durationMs:Math.round(performance.now()-start)} }
export async function executeWorkflow(workflow:Workflow):Promise<ExecutionResult>{const errors=validateWorkflow(workflow);if(errors.length)return{status:'error',error:errors[0].message,events:[]}; const started=Date.now(); let payload:Record<string,unknown>={}; let response:ResponseDefinition|undefined; const webhook=workflow.nodes.find(n=>n.data.kind==='webhook'); if(webhook?.data.kind==='webhook') payload=JSON.parse(webhook.data.samplePayload); const request=workflow.nodes.find(n=>n.data.kind==='request'); if(request?.data.kind==='request') response=mockRequest(request.data.request,{payload}); return{status:'success',response,events:[{id:crypto.randomUUID(),workflowId:workflow.id,startedAt:new Date(started).toISOString(),completedAt:new Date().toISOString(),status:'success',trigger:'manual',durationMs:Date.now()-started,response}]}}
