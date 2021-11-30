import Table from 'rc-table';
import React, { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';

function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
function readFile(file){
  return new Promise((resolve, reject) => {
    var fr = new FileReader();  
    fr.onload = () => {
      resolve(fr.result )
    };
    fr.onerror = reject;
    fr.readAsText(file);
  });
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

let xmltohtml = (path, contents) => {
  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(contents, "text/xml");
  // console.log(xmlDoc);
  window.xmlDoc = xmlDoc;
  let docs = xmlDoc.getElementsByTagNameNS('*', 'EmbeddedDocumentBinaryObject');
  let xslt = "";

  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    let v = d.attributes.filename.value;
    let ext = v.split('.').pop().toLowerCase();
    if (ext === "xslt" || ext === "xsl") {
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

  if (!xslt) {
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

  // var frog = window.open(winUrl,  '_blank'); //,"location=no,menubar=no,scrollbars=no,status=no")
  // frog.print();

  // setTimeout(function () { frog.print(); }, 1);
  // frog.onfocus = function () { setTimeout(function () { frog.close(); }, 500); }
  // frog.close();
  // frog.print();

  return {
    path: path,
    id: xmlDoc.querySelector("Invoice>ID").innerHTML,
    UUID: xmlDoc.querySelector("Invoice>UUID").innerHTML,
    type: xmlDoc.querySelector("Invoice>ProfileID").innerHTML,
    blob: winUrl,
    sellerID: xmlDoc.querySelector("Invoice>AccountingSupplierParty>Party>PartyIdentification>ID[schemeID=\"VKN\"],Invoice>AccountingCustomerParty>Party>PartyIdentification>ID[schemeID=\"TCKN\"]").innerHTML,
    sellerName: xmlDoc.querySelector("Invoice>AccountingSupplierParty>Party>PartyName>Name").innerHTML,
    buyerID: xmlDoc.querySelector("Invoice>AccountingCustomerParty>Party>PartyIdentification>ID[schemeID=\"VKN\"],Invoice>AccountingCustomerParty>Party>PartyIdentification>ID[schemeID=\"TCKN\"]").innerHTML,
    buyerName: xmlDoc.querySelector("Invoice>AccountingCustomerParty>Party>PartyName>Name").innerHTML,
    total: window.xmlDoc.querySelector("Invoice>LegalMonetaryTotal>TaxExclusiveAmount").innerHTML,
    totalWithTax: window.xmlDoc.querySelector("Invoice>LegalMonetaryTotal>TaxInclusiveAmount").innerHTML
  }
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
  } = useDropzone({ accept: 'text/xml', maxFiles: 100 });

  const [invoices, setInvoices] = React.useState([]);

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

  const fileRejectionItems = fileRejections.map(({ file, errors }) => {
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

    Promise.all(acceptedFiles.map(async file => {
      return xmltohtml(file.path, await readFile(file));
    })).then(res => {
      setInvoices(res);
    });

  }, [acceptedFiles])


  const printBlob = (e, blob) => {
    e.preventDefault();

    var frog = window.open(blob,  '_blank'); //,"location=no,menubar=no,scrollbars=no,status=no")
    frog.document.title = "Invoice";
    frog.print();
    setTimeout(function () { frog.close(); }, 500);
  }

  return (
    <section className='container'>
      <div className='container p-2' style={{ backgroundColor: '#3789DC', borderRadius: 5 }}>
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          <p>XML dosyanızı buraya sürükleyip bırakın veya dosyanızı seçmek için tıklayın</p>

        </div>
      </div>
      {/* <aside>
        <h4>Accepted files</h4>
        <ul>{acceptedFileItems}</ul>
        <h4>Rejected files</h4>
        <ul>{fileRejectionItems}</ul>
      </aside> */}
      <h2> XML Sonuçları </h2>
      <div className="table-responsive">

      <table className="table" style={{fontSize:18}}>
        <thead>
          <tr>
      
            <th>ID</th>
            <th>Type</th>
            <th>Buyer</th>
            <th>Seller</th>
            <th>Total</th>
            <th>TotalWithTax</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(i => (
            <tr key={i.UUID}>
              <td>{i.id}</td>
              <td>{i.type}</td>
              <td>{i.buyerName}({i.buyerID})</td>
              <td>{i.sellerName}({i.sellerID})</td>
              <td>{i.total}</td>
              <td>{i.totalWithTax}</td>
              <td><a target={i.UUID} href={i.blob}>Görüntüle</a>
              <a download={`${i.id}.html`} href={i.blob}>İndir</a>
              <a href={i.blob} onClick={e => printBlob(e, i.blob)}>Yazdır</a></td>

            </tr>

          ))}


        </tbody>
      </table>
</div>
    </section>
  );
}
