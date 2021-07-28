import logo from './logo.svg';
import './App.css';
function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
function App() {
  let xmltohtml = (contents) => {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(contents, "text/xml");
    // console.log(xmlDoc);
    let docs = xmlDoc.getElementsByTagNameNS('*', 'EmbeddedDocumentBinaryObject');
    let xslt = "";

    for(let i = 0; i < docs.length; i++) {
      const d = docs[i];
      let v = d.attributes.filename.value;
      let ext = v.split('.').pop().toLowerCase();
      if(ext === "xslt" || ext === "xsl") {
        xslt = b64DecodeUnicode(d.innerHTML);
      }
      console.log(v, ext);
      // if(d.)
      window.d = d;
      console.log(i, d);
    }
    // return;
    // let xslt = b64DecodeUnicode(docs[0].innerHTML);
    console.log(xslt);

    if(!xslt) {
      alert("Geçersiz");
      return;
    }
    var xsltProcessor = new XSLTProcessor();

    let parser2 = new DOMParser();
    let xslStylesheet = parser2.parseFromString(xslt, "text/xml");
    xsltProcessor.importStylesheet(xslStylesheet);
    
    var doc = xsltProcessor.transformToDocument(xmlDoc);
    
    console.log(doc);
    // window.doc = doc;
    let blob = new XMLSerializer().serializeToString(doc)
    // console.log(blob);
    const winUrl = URL.createObjectURL(
      new Blob([blob], { type: "text/html;charset=utf-8;" })

    );

    var frog = window.open(winUrl,  '_blank'); //,"location=no,menubar=no,scrollbars=no,status=no")
    frog.print();

    // setTimeout(function () { frog.print(); }, 1);
    // frog.onfocus = function () { setTimeout(function () { frog.close(); }, 500); }
    // frog.close();
    // frog.print();
  }
let getXml = (event) => {
    event.preventDefault();
    event.target.files[0].text().then(contents => {
      xmltohtml(contents);
    });
}
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
            xmltohtml(contents);

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
        <label
          className="App-link"
          htmlFor={"choseFile"}
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </label>
        <input id="choseFile" onChange={getXml} type='file' style={{ display: 'none' }} accept="text/xml" />
      </header>
    </div>
  );
}

export default App;
