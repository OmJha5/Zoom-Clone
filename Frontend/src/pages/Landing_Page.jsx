import React, { useEffect } from 'react'
import "../App.css";
import { Link, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import useCheckUser from '../hooks/useCheckUser';
import { useSelector } from 'react-redux';

export default function Landing_Page() {
  let navigate = useNavigate();
  useCheckUser();

  let id = useSelector((state) => state.auth.id);

  let registerHandler = () => {
    navigate("/auth" , {
        state : {
          formState : 1
        }
    })
  }

  let loginHandler = () => {
    navigate("/auth" , {
        state : {
          formState : 0
        }
    })
  }

  let guestHandler = () => {
    const id = nanoid(10); // Give unique string of 10 characters . nanoid is a library for this
    navigate(`/${id}`)
  }

  return (
    <div className='landingPageContainer'>
      <nav>
        <div className="navHeader">
          <h2>
            <Link style={{ textDecoration: "none", color: "white" }} to={"/"}>Zoom Video Call</Link>
          </h2>
        </div>
        <div className="navList">
          <ul>
            {
              id == null && <li onClick={guestHandler}>Join As Guest</li> // that means agar user logged in nhi hai tabhi yeh show karo
            }
            <li>
              <div onClick={registerHandler} role="button">
                <p>Register</p>
              </div>
            </li>
            <li>
              <div onClick={loginHandler} role="button">
                <p>Login</p>
              </div>
            </li>
          </ul>

        </div>
      </nav>

      <main className="landingPageMainContainer">
        <div>
          <h1><span style={{ color: "#FF9839" }}>Connect</span> with your old ones</h1>
          <p className='mainP'>Join a video call with your friends and family, no matter where they are.</p>

          <div role="button">
            <Link to={"/home"}>Get Started</Link>
          </div>
        </div>

        <div>
          <img src="images/mobile.png" alt="" />
        </div>
      </main>
    </div>
  )
}
