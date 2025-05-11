import os from 'node:os';
import { useState } from 'react';
import electronLogo from './assets/electron.svg';
import reactLogo from './assets/react.svg';
import './App.css';

import viteLogo from '/vite.svg';

function App() {
  const [count, setCount] = useState(0);

  const versions = ['chrome', 'node', 'electron']
    .map(s => `${s}: ${process.versions[s]}`)
    .concat([`platform: ${os.platform()} ${os.arch()}`]);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://www.electronjs.org" target="_blank" rel="noreferrer">
          <img src={electronLogo} className="logo electron" alt="React logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + Electron + React</h1>
      <div className="card">
        <div style={{ marginBottom: '1em' }}>{versions.join(', ')}</div>
        <button onClick={() => setCount(count => count + 1)}>
          count is
          {count}
        </button>
        <p>
          Edit
          {' '}
          <code>src/App.tsx</code>
          {' '}
          and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}

export default App;
