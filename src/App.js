import './App.css';
import React, { useCallback } from 'react';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { Button } from 'react-bootstrap';


function App() {
  const handle = useFullScreenHandle();
  return (
    <div className="App">
      <Button variant="light" size="lg" onClick={handle.enter}>Fullscreen</Button>{' '}
      <div className="About">
        <h5>Made with ❤️ by <a href="https://www.github.com/tengfone" target="_blank">Teng Fone</a></h5>
      </div>
      <FullScreen handle={handle}>
        <div className='App' style={{ cursor: 'none' }}>
        </div>
      </FullScreen>
    </div>
  );
}

export default App;
