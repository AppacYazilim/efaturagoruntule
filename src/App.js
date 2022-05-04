import React from 'react';
import StyledDropZone from '../src/components/styledDropZone'
import 'bootstrap/dist/css/bootstrap.min.css';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {

  return (
    <div className="container-fluid" >
      {/* onDrop={f} onDragOver={drag}  */}
      <header>
       
        {/* <input id="choseFile" onChange={getXml} type='file' style={{ display: 'none' }} accept="text/xml" /> */}
        <StyledDropZone />
      </header>

      <footer style={{clear:'both', position:'relative'}} className={"text-muted container-fluid text-small mt-4 "}>
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
