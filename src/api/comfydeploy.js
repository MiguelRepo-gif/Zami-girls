<<<<<<< HEAD
const BASE = '/cd-proxy'
=======
const BASE = 'https://api.comfydeploy.com/api'
>>>>>>> 5bf7e32dade7e3faa5558eef0f89a6113564c6bb
const KEY  = import.meta.env.VITE_COMFYDEPLOY_API_KEY

function headers() {
  return { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }
}

export async function runDeployment(deploymentId, inputs) {
<<<<<<< HEAD
  const res = await fetch(`${BASE}/api/run/deployment/queue`, {
=======
  const res = await fetch(`${BASE}/run/deployment/queue`, {
>>>>>>> 5bf7e32dade7e3faa5558eef0f89a6113564c6bb
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ deployment_id: deploymentId, inputs }),
  })
  if (!res.ok) throw new Error(`ComfyDeploy error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.run_id
}

export async function pollRun(runId, onTick, intervalMs = 8000, maxWaitMs = 600000) {
  const deadline = Date.now() + maxWaitMs
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, intervalMs))
<<<<<<< HEAD
    const res = await fetch(`${BASE}/api/run/${runId}`, { headers: headers() })
    if (!res.ok) throw new Error(`Poll error ${res.status}`)
=======
    const res = await fetch(`${BASE}/run/${runId}`, { headers: headers() })
    if (!res.ok) throw new Error(`Poll error: ${res.status}`)
>>>>>>> 5bf7e32dade7e3faa5558eef0f89a6113564c6bb
    const data = await res.json()
    onTick?.(data.status)
    if (data.status === 'success') return data
    if (['failed', 'cancelled', 'timeout'].includes(data.status)) {
      throw new Error(`Run ${data.status}`)
    }
  }
  throw new Error('Timeout waiting for ComfyDeploy run')
}

// Real API format: outputs is an array of { data: { [nodeKey]: [{url, type, filename}] } }
export function extractBase64Images(runResult) {
  const outputs = runResult?.outputs
<<<<<<< HEAD
  if (!Array.isArray(outputs)) return []
  return outputs
    .flatMap(o => o?.data?.images ?? [])
    .map(img => img?.url)
    .filter(Boolean)
=======
  const results = []
  if (!outputs) return results

  if (Array.isArray(outputs)) {
    for (const out of outputs) {
      const data = out?.data
      if (!data || typeof data !== 'object') continue
      for (const key of Object.keys(data)) {
        const items = data[key]
        if (!Array.isArray(items)) continue
        for (const item of items) {
          if (item?.url) results.push(item.url)
          else if (typeof item === 'string' && item.startsWith('http')) results.push(item)
          else if (typeof item === 'string') results.push(`data:image/png;base64,${item}`)
        }
      }
    }
    if (results.length) return results
  }

  // fallback: legacy flat object format
  if (typeof outputs === 'object' && Array.isArray(outputs.images)) {
    outputs.images.forEach(i => {
      if (i?.url) results.push(i.url)
      else if (typeof i === 'string') results.push(i.startsWith('http') ? i : `data:image/png;base64,${i}`)
    })
  }
  return results
>>>>>>> 5bf7e32dade7e3faa5558eef0f89a6113564c6bb
}
