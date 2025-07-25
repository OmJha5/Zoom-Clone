import React from 'react'
import "../App.css";
import { Link } from 'react-router-dom';

export default function Landing_Page() {
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className="navHeader">
            <h2>
                <Link style={{textDecoration : "none" , color : "white"}} to={"/"}>Zoom Video Call</Link>
            </h2>
        </div>
        <div className="navList">
            <ul>
                <li>Join As Guest</li>
                <li>Register</li>
                <li>
                    <div role="button">
                        <p>Login</p>
                    </div>
                </li>
            </ul>

        </div>
      </nav>

      <main className="landingPageMainContainer">
        <div>
            <h1><span style={{color : "#FF9839"}}>Connect</span> with your old ones</h1>
            <p className='mainP'>Join a video call with your friends and family, no matter where they are.</p>

            <div role="button">
                <Link to={"/auth"}>Get Started</Link>
            </div>
        </div>

        <div>
            <img src="images/mobile.png" alt="" />
        </div>
      </main>
    </div>
  )
}
