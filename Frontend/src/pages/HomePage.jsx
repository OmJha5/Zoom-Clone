import React from 'react'
import useCheckUser from '../hooks/useCheckUser'

export default function HomePage() {
    useCheckUser();
    
  return (
    <div>
      Home Page
    </div>
  )
}
