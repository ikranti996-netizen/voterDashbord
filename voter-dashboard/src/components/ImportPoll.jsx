// src/components/ImportPoll.jsx
import React, { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { importPollFromString } from '../utils/polls'

export default function ImportPoll(){
  const [q] = useSearchParams()
  const navigate = useNavigate()

  useEffect(()=>{
    const data = q.get('data')
    if(!data) {
      alert('No poll data found in the link')
      navigate('/')
      return
    }
    const p = importPollFromString(data)
    if(p) {
      alert('Poll imported! Opening poll...')
      navigate(`/poll/${p.id}`)
    } else {
      alert('Failed to import poll')
      navigate('/')
    }
  },[])
  return <div style={{padding:24}}>Importing...</div>
}
