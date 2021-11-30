import React, {useMemo} from 'react';
import {useDropzone} from 'react-dropzone';

function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 5,
  borderColor: 'white',
  borderStyle: 'dashed',
  backgroundColor: '#3789DC',
  color: 'white',
  outline: 'none',

  transition: 'border .24s ease-in-out',
  
};

const activeStyle = {
  borderColor: '#2196f3'
};

const acceptStyle = {
  borderColor: '#00e676'
};

const rejectStyle = {
  borderColor: '#ff1744'
};

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

export default function StyledDropzone(props) {
  const {
    acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,    
  } = useDropzone({accept: 'text/xml', maxFiles:1});

  const style = useMemo(() => ({
    ...baseStyle,
    ...(isDragActive ? activeStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isDragActive,
    isDragReject,
    isDragAccept
  ]);

  const acceptedFileItems = acceptedFiles.map(file => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
    </li>
  ));

  const fileRejectionItems = fileRejections.map(({ file, errors  }) => { 
    return (
      <li key={file.path}>
           {file.path} - {file.size} bytes
           <ul>
             {errors.map(e => <li key={e.code}>{e.message}</li>)}
          </ul>
 
      </li>
    ) 
   });

   React.useEffect(() => {
     console.log(acceptedFiles)

     if(acceptedFiles.length > 0) {
       const reader = new FileReader();
       reader.onload = function(e) {
         xmltohtml(e.target.result);
       }
       reader.readAsText(acceptedFiles[0]);
       
     }
    //  xmltohtml(acceptedFiles.name);
   },[acceptedFiles])

  return (
<section className='container'>
  <div className='container p-2' style={{backgroundColor:'#3789DC', borderRadius:5}}>
      <div {...getRootProps({style})}>
        <input {...getInputProps()} />
        <p>XML dosyanızı buraya sürükleyip bırakın veya dosyanızı seçmek için tıklayın</p>
        
      </div>
      </div>
      <aside>
        {/* <h4>Accepted files</h4>
        <ul>{acceptedFileItems}</ul>
        <h4>Rejected files</h4>
        <ul>{fileRejectionItems}</ul> */}
      </aside>
</section>
  );
}

