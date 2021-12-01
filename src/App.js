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
    <div className="App" >
      {/* onDrop={f} onDragOver={drag}  */}
      <header className="App-header">
        <h1>XML Fatura Dönüştürücüsü</h1>
        {/* <input id="choseFile" onChange={getXml} type='file' style={{ display: 'none' }} accept="text/xml" /> */}
        <StyledDropZone />
      </header>

      <footer className={"text-muted container text-small"}>
        <small>
        &copy; 2021 <a href={"https://appac.ltd"} rel="noreferrer" target={"_blank"}>Appac Yazılım Elektronik San. Tic. Ltd. Şti. </a><br />
        Tüm hakları saklıdır. Verileriniz hiçbir şekilde sunucularımıza iletilmemektedir. HİÇ BİR ŞEKİLDE SİSTEMİN ÇALIŞMASI ÜZERİNE GARANTİ VERİLMEMEKTİR! TAMAMEN REFERANS AMAÇLI KULLANILMALIDIR. SİSTEM MALİ MÜHÜR DOĞRULAMASI YAPMAMAKTADIR! 
        Appac Yazılım Elektronik San. Tic. Ltd. Şti. SİSTEMİN ÇALIŞMAMASI VEYA YANLIŞ ÇALIŞMASI DURUMUNDA HİÇ BİR SORUMLULUK KABUL ETMEZ. SİSTEME DOSYA YÜKLEMEK İLE BU KOŞULLARI KABUL ETTİĞİNİZ VARSAYILIR. 
        </small>
      </footer>
      <ToastContainer />
    </div>

  );
}

export default App;
