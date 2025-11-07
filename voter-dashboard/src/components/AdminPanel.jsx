// src/components/AdminPanel.jsx
import React, { useEffect, useState } from 'react'
import { loadPolls, adminSetVotes, adminResetVotes, adminDeletePoll, adminSetPoll } from '../utils/polls'
import './../styles/admin.css'

export default function AdminPanel(){
  const [polls, setPolls] = useState([])
  const [editing, setEditing] = useState(null)

  useEffect(()=> setPolls(loadPolls()), [])

  function refresh(){ setPolls(loadPolls()) }

  function setVotes(pollId, optId, value){
    adminSetVotes(pollId,optId,Number(value)||0); refresh()
  }
  function reset(pollId){ if(confirm('Reset votes?')){ adminResetVotes(pollId); refresh() } }
  function del(pollId){ if(confirm('Delete poll?')){ adminDeletePoll(pollId); refresh() } }

  function saveEdit(){
    if(!editing) return
    adminSetPoll(editing)
    setEditing(null)
    refresh()
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Admin — Manage Polls</h2>
        <div className="small">You are on the admin route (protected path). Changes here apply to all users on this device.</div>

        <div className="mt-3">
          {polls.map(p=>(
            <div key={p.id} className="admin-poll">
              <div style={{flex:1}}>
                <div style={{fontWeight:700}}>{p.title}</div>
                {p.options.map(o=>(
                  <div key={o.id} className="row mt-2" style={{alignItems:'center'}}>
                    <div style={{flex:1}}>{o.label}</div>
                    <input type="number" defaultValue={o.votes||0} onBlur={(e)=>setVotes(p.id,o.id,e.target.value)} className="input" style={{width:120}} />
                  </div>
                ))}
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:8,marginLeft:12}}>
                <button onClick={()=>reset(p.id)} className="btn btn-ghost">Reset</button>
                <button onClick={()=>del(p.id)} className="btn btn-danger">Delete</button>
                <button onClick={()=>setEditing(p)} className="btn btn-ghost">Edit</button>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="card mt-3">
            <h3>Edit poll</h3>
            <input value={editing.title} onChange={(e)=>setEditing({...editing, title:e.target.value})} className="input" />
            {editing.options.map((o,i)=>(
              <div key={o.id} className="row mt-2">
                <input value={o.label} onChange={(e)=>{ const arr=[...editing.options]; arr[i].label=e.target.value; setEditing({...editing, options:arr}) }} className="input" />
                <input type="number" value={o.votes} onChange={(e)=>{ const arr=[...editing.options]; arr[i].votes=Number(e.target.value); setEditing({...editing, options:arr}) }} className="input" style={{width:120}} />
              </div>
            ))}
            <div className="row mt-2">
              <button onClick={saveEdit} className="btn btn-primary">Save</button>
              <button onClick={()=>setEditing(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
