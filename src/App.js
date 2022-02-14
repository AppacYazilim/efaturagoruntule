import React from 'react';
import StyledDropZone from '../src/components/styledDropZone'
import 'bootstrap/dist/css/bootstrap.min.css';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
// function b64DecodeUnicode(str) {
//   // Going backwards: from bytestream, to percent-encoding, to original string.
//   return decodeURIComponent(atob(str).split('').map(function (c) {
//     return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//   }).join(''));
// }
function App() {

  return (
    <div className="" >
      {/* onDrop={f} onDragOver={drag}  */}
      {/* <header> */}
       
        {/* <input id="choseFile" onChange={getXml} type='file' style={{ display: 'none' }} accept="text/xml" /> */}
        <StyledDropZone />
      {/* </header> */}
      <ToastContainer />
    </div>

  );
}

export default App;
