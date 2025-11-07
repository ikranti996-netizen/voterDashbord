// src/components/PollDetail.jsx
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { loadPolls, savePolls, hasVotedOnDevice, markVotedOnDevice, getDeviceChoice } from '../utils/polls'
import DonutChart from './DonutChart'
import BarChartHorizontal from './BarChartHorizontal'
import './../styles/poll.css'
import './../styles/chartNew.css'

export default function PollDetail(){
  const { id } = useParams()
  const [poll, setPoll] = useState(null)
  const [votedChoice, setVotedChoice] = useState(null)
  const [error, setError] = useState('')

  useEffect(()=>{
    function load(){
      const polls = loadPolls()
      const p = polls.find(x=>x.id===id) || null
      setPoll(p)
      if(hasVotedOnDevice(id)) setVotedChoice(getDeviceChoice(id))
    }
    load()
    function onStorage(e){
      if(e.key === null || e.key === 'polls_v1') load()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('polls-updated', onStorage)
    return ()=>{ window.removeEventListener('storage', onStorage); window.removeEventListener('polls-updated', onStorage) }
  },[id])

  if(!poll) return <div className="card">Poll not found</div>

  const total = poll.options.reduce((s,o)=>s+(o.votes||0),0)
  const chartData = poll.options.map(o=>({ name:o.label, value:o.votes||0, percent: total ? Math.round(((o.votes||0)/total)*100) : 0 }))

  function handleVote(optId){
    setError('')
    if(hasVotedOnDevice(id)) return setError('You already voted on this device.')
    const polls = loadPolls()
    const pIndex = polls.findIndex(x=>x.id===id)
    if(pIndex === -1) return setError('Poll missing')
    const optIndex = polls[pIndex].options.findIndex(o=>o.id===optId)
    if(optIndex === -1) return setError('Option missing')
    polls[pIndex].options[optIndex].votes = (polls[pIndex].options[optIndex].votes || 0) + 1
    savePolls(polls)
    markVotedOnDevice(id, optId)
    setVotedChoice(optId)
    setPoll(polls[pIndex])
  }

  return (
    <div className="page">
      <div className="card">
        <h2>{poll.title}</h2>
        <div className="muted small">Created: {new Date(poll.createdAt).toLocaleString()}</div>

        <div className="mt-4">
          {poll.options.map(o=>{
            const percent = total ? Math.round(((o.votes||0)/total)*100) : 0
            const voted = votedChoice === o.id
            return (
              <div key={o.id} className="option">
                <div className="option-head">
                  <div>
                    <div className="option-label">{o.label}</div>
                    <div className="option-meta">{o.votes || 0} votes • {percent}%</div>
                  </div>
                  <div style={{width:160}}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{width:`${percent}%`, background:`linear-gradient(90deg,#6366F1,#06B6D4)`}} />
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <button onClick={()=>handleVote(o.id)} disabled={!!votedChoice} className={votedChoice ? 'btn btn-ghost' : 'btn btn-primary'}>
                    {voted ? 'Voted' : 'Vote'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card mt-4">
        <h3>Results</h3>
        {votedChoice ? (
          <>
            <DonutChart data={poll.options.map(o=>({ label:o.label, votes:o.votes }))} />
            <BarChartHorizontal data={poll.options.map(o=>({ label:o.label, votes:o.votes }))} />
            <div className="small mt-2">Total votes: <strong>{total}</strong></div>
          </>
        ) : (
          <div className="small">Vote to see detailed charts.</div>
        )}

        <div className="mt-2">
          <Link to="/" className="btn btn-ghost">Back</Link>
        </div>
      </div>
    </div>
  )
}
