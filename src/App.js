import logo from './logo.svg';
import './App.css';
function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
function App() {
  let f = (ev) => {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
  
    if (ev.dataTransfer.items) {
      console.log("f");
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === 'file') {

          var file = ev.dataTransfer.items[i].getAsFile();

         let reader = new FileReader();
          reader.onload = function (event) {
            let contents = event.target.result;


            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(contents,"text/xml");
            console.log(xmlDoc);
            let xslt = b64DecodeUnicode(xmlDoc.getElementsByTagName('cbc:EmbeddedDocumentBinaryObject')[0].innerHTML);
            console.log(xslt);


            var xsltProcessor = new XSLTProcessor();

            let parser2 = new DOMParser();
            let xslStylesheet = parser2.parseFromString(xslt,"text/xml");
            xsltProcessor.importStylesheet(xslStylesheet);
            var doc = xsltProcessor.transformToDocument(xmlDoc);
            console.log(doc);
            // window.doc = doc;
            let blob = new XMLSerializer().serializeToString(doc)
            console.log(blob);
          const winUrl = URL.createObjectURL(
            new Blob(["\ufeff", blob], { type: "text/html;charset=utf-8;" })
        );

          var frog = window.open(winUrl)
            //holder.style.background = 'url(' + event.target.result + ') no-repeat center';
        
          };
          console.log(file);
          reader.readAsText(file);


          console.log('... file[' + i + '].name = ' + file.name);
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.files.length; i++) {
        console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
      }
    }
  };
  let drag = (event) => {
    console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
  }
  return (
    <div className="App" onDrop={f} onDragOver={drag}>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
