// src/components/PollList.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadPolls, savePolls, newPoll, exportPollUrl } from '../utils/polls'
import './../styles/poll.css'

export default function PollList(){
  const [polls, setPolls] = useState([])
  const [title, setTitle] = useState('')
  const [options, setOptions] = useState(['',''])
  const navigate = useNavigate()

  useEffect(()=>{
    setPolls(loadPolls())
    // update when other tabs modify polls
    function onStorage(e){
      if(e.key === null || e.key === 'polls_v1') setPolls(loadPolls())
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('polls-updated', onStorage)
    return ()=>{ window.removeEventListener('storage', onStorage); window.removeEventListener('polls-updated', onStorage) }
  },[])

  function addOption(){ setOptions([...options, '']) }
  function changeOpt(i,val){ const arr=[...options]; arr[i]=val; setOptions(arr) }

  function handleCreate(e){
    e.preventDefault()
    const t = title.trim(); const opts = options.map(o=>o.trim()).filter(Boolean)
    if(!t || opts.length < 2) return alert('Title and at least 2 options required')
    const p = newPoll({ title:t, options:opts })
    const ps = loadPolls(); ps.unshift(p); savePolls(ps)
    setTitle(''); setOptions(['',''])
    // go to poll detail
    navigate(`/poll/${p.id}`)
  }

  function handleExport(poll){
    // copy link to clipboard
    const url = exportPollUrl(poll)
    navigator.clipboard?.writeText(url).then(()=> alert('Share link copied to clipboard!'), ()=> alert(url))
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Create poll</h2>
        <form onSubmit={handleCreate}>
          <input placeholder="Poll title" value={title} onChange={(e)=>setTitle(e.target.value)} className="input" />
          {options.map((o,i)=> <input key={i} value={o} onChange={(e)=>changeOpt(i,e.target.value)} placeholder={`Option ${i+1}`} className="input mt-2" />)}
          <div className="row mt-2">
            <button type="button" onClick={addOption} className="btn btn-ghost">Add option</button>
            <button type="submit" className="btn btn-primary ml-auto">Create</button>
          </div>
        </form>
      </div>

      <div className="card mt-4">
        <h2>All polls</h2>
        <div className="list">
          {polls.length === 0 && <div className="small">No polls yet</div>}
          {polls.map(p=>(
            <div key={p.id} className="poll-row">
              <Link to={`/poll/${p.id}`} className="poll-link">{p.title}</Link>
              <div>
                <button onClick={()=>handleExport(p)} className="btn btn-ghost">Share</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
