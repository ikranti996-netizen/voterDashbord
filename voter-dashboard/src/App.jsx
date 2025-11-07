// src/App.jsx
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import PollList from './components/PollList'
import PollDetail from './components/PollDetail'
import AdminPanel from './components/AdminPanel'
import ImportPoll from './components/ImportPoll'

export default function App(){
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<PollList />} />
        <Route path="/poll/:id" element={<PollDetail />} />
        {/* Admin locked to the passkey path */}
        <Route path="/admin/5688" element={<AdminPanel />} />
        {/* import route: opens a link that carries poll JSON in ?data=... */}
        <Route path="/import" element={<ImportPoll />} />
      </Routes>
    </div>
  )
}
