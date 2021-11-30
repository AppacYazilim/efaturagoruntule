import React, { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';

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

    if (acceptedFiles.length > 0) {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];

        const reader = new FileReader();
        reader.onload = function (e) {
          const r = xmltohtml(file.path, e.target.result);
          console.log(r);
          if (r) {
            const existingInvoice = invoices.find(i => i.UUID === r.UUID);
            if (!existingInvoice) {
              setInvoices([...invoices, r]);
            }
          }
        }
        reader.readAsText(file);
      }
    }
    //  xmltohtml(acceptedFiles.name);
  }, [acceptedFiles])

  return (
    <section className='container'>
      <div className='container p-2' style={{ backgroundColor: '#3789DC', borderRadius: 5 }}>
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          <p>XML dosyanızı buraya sürükleyip bırakın veya dosyanızı seçmek için tıklayın</p>

        </div>
      </div>
      <aside>
        <h4>Accepted files</h4>
        <ul>{acceptedFileItems}</ul>
        <h4>Rejected files</h4>
        <ul>{fileRejectionItems}</ul>
      </aside>
      {invoices.map(i => (
        <div key={i.UUID}>
          ID #{i.id}({i.type})
          Buyer {i.buyerName}({i.buyerID})
          Seller {i.sellerName}({i.sellerID})
          Total {i.total}
          TotalWithTax {i.totalWithTax}
          <a target={i.UUID} href={i.blob}>Open</a>
        </div>
      ))}
    </section>
  );
}

