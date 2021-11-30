import Table from 'rc-table';
import React, { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ReactTooltip from "react-tooltip";

function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
var saveData = (function () {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  return function (data, fileName) {
      var json = JSON.stringify(data),
          blob = new Blob([json], {type: "octet/stream"}),
          url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
  };
}());
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
function readFileBuffer(file){
  return new Promise((resolve, reject) => {
    var fr = new FileReader();  
    fr.onload = () => {
      resolve(fr.result )
    };
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
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
    // console.log(v, ext);
    // if(d.)
    // window.d = d;
    // console.log(i, d);
  }
  // return;
  // let xslt = b64DecodeUnicode(docs[0].innerHTML);
  // console.log(xslt);

  if (!xslt) {
    return;
  }
  var xsltProcessor = new XSLTProcessor();

  let parser2 = new DOMParser();
  let xslStylesheet = parser2.parseFromString(xslt, "text/xml");
  xsltProcessor.importStylesheet(xslStylesheet);

  var doc = xsltProcessor.transformToDocument(xmlDoc);

  // console.log(doc);
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

  const time = xmlDoc.querySelector("Invoice>IssueTime");
  var t = null;
  if(time) {
    t = time.innerHTML;
  }

  var seller = xmlDoc.querySelector("Invoice>AccountingSupplierParty>Party")

  var sellerID = null;
  var sellerName = null;

  if(seller) {
    sellerID = seller.querySelector("PartyIdentification>ID[schemeID=\"VKN\"],PartyIdentification>ID[schemeID=\"TCKN\"]").innerHTML;
    console.log(seller);
    sellerName = seller.querySelector("PartyName>Name")?.innerHTML;

    if(!sellerName) {
      sellerName = seller.querySelector("Person>FirstName")?.innerHTML + " " +  seller.querySelector("Person>FamilyName")?.innerHTML;
    }
  } else {
    console.log("Error: Seller not found", path);
    return ;
  }

  return {
    path: path,
    id: xmlDoc.querySelector("Invoice>ID").innerHTML,
    UUID: xmlDoc.querySelector("Invoice>UUID").innerHTML,
    type: xmlDoc.querySelector("Invoice>ProfileID").innerHTML,
    blob: winUrl,
    contents: blob,
    original: contents,
    sellerID,
    sellerName,
    buyerID: xmlDoc.querySelector("Invoice>AccountingCustomerParty>Party>PartyIdentification>ID[schemeID=\"VKN\"],Invoice>AccountingCustomerParty>Party>PartyIdentification>ID[schemeID=\"TCKN\"]").innerHTML,
    buyerName: xmlDoc.querySelector("Invoice>AccountingCustomerParty>Party>PartyName>Name").innerHTML,
    total: parseFloat(xmlDoc.querySelector("Invoice>LegalMonetaryTotal>TaxExclusiveAmount").innerHTML),
    totalWithTax: parseFloat(xmlDoc.querySelector("Invoice>LegalMonetaryTotal>TaxInclusiveAmount").innerHTML),
    issueDate: xmlDoc.querySelector("Invoice>IssueDate").innerHTML,
    issueTime: t
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
  } = useDropzone({ accept: ['text/xml', 'application/zip'], maxFiles: 100 });

  const [files, setFiles] = React.useState([]);
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
    setFiles(acceptedFiles);
  }, [acceptedFiles]);
  
  React.useEffect(() => {

    if(files.length === 0) {
      return;
    }

    Promise.all(files.map(async file => {
      if(file.type === "text/xml") {
        return xmltohtml(file.path, await readFile(file));
      } else if(file.type === "application/zip") {
        const fileBuffer = await readFileBuffer(file);
        
        const zip = await JSZip.loadAsync(fileBuffer)


        window.zip = zip;

        const out = await Promise.all(Object.keys(zip.files).map(async (k) => {
          const file = zip.files[k];

          if(file.name.endsWith(".xml")) {
            return xmltohtml(file.name, await file.async("text"));
          }
        }));

        return out;
      } else {
        return null;
      }
    })).then(res => {

      const resfiltered = res.flat(1).filter(res => res);
      const existingInvoices = invoices.filter(inv => !resfiltered.find(r => inv.id === r.id));

      console.log(existingInvoices);

      setInvoices([...existingInvoices, ...resfiltered]);
      setFiles([]);
    });

  }, [files])


  const printBlob = (e, blob) => {
    e.preventDefault();

    var frog = window.open(blob,  '_blank'); //,"location=no,menubar=no,scrollbars=no,status=no")
    frog.document.title = "Invoice";
    frog.print();
    setTimeout(function () { frog.close(); }, 500);
  }

 

  const downloadAll = (e) => {

    const zipFile = new JSZip();


    invoices.forEach(invoice => {
      const [year, month, day] = invoice.issueDate.split('-');

      zipFile.file(`${year}/${month}/${day}/${invoice.id}.html`, invoice.contents);
      zipFile.file(`${year}/${month}/${day}/${invoice.id}.xml`, invoice.original);


    });
    zipFile.generateAsync({ type: "blob" })
      .then(function (content) {
        // see FileSaver.js
        saveAs(content, "Faturalar.zip");
      });
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
      <h2> İşlenen Faturalar </h2>
      <div className="table-responsive">
      
      <table className="table" style={{fontSize:18}}>
        <thead>
          <tr>
      
            <th>Fatura No</th>
            <th>Türü</th>
            <th>Satıcı</th>
            <th>Alıcı</th>
            <th>Düzenlenme Tarihi</th>
            <th>Düzenlenme Saati</th>
            <th>Vergiler Hariç Toplam</th>
            <th>Vergiler Dahil Toplam</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(i => (
            <tr key={i.UUID}>
              <td><code>{i.id}</code></td>
              <td>{i.type}</td>

              
              <td><ReactTooltip id={`seller_${i.UUID}`}><span>{i.sellerName}</span></ReactTooltip><a data-tip data-for={`seller_${i.UUID}`} href={"#"}><code>{i.sellerID}</code></a></td>
              <td><ReactTooltip id={`buyer_${i.UUID}`}><span>{i.buyerName}</span></ReactTooltip><a data-tip data-for={`buyer_${i.UUID}`} href={"#"}><code>{i.buyerID}</code></a></td>
              <td>{i.issueDate}</td>
              <td>{i.issueTime || "-"}</td>
              <td>{i.total}</td>
              <td>{i.totalWithTax}</td>
              <td><a target={i.UUID} href={i.blob}>Görüntüle</a>
              <a download={`${i.id}.html`} href={i.blob}>İndir</a>
              <a href={i.blob} onClick={e => printBlob(e, i.blob)}>Yazdır</a>
              <a href={"#"} onClick={e => {
                setInvoices(invoices.filter(invoice => invoice.id !== i.id))
              }}>Sil</a></td>

            </tr>

          ))}

          <tr>
            <td>Toplam: {invoices.length} Fatura</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>{invoices.reduce((s,i) => s + i.total, 0)}</td>
            <td>{invoices.reduce((s,i) => s + i.totalWithTax, 0)}</td>
            <td>{invoices.length > 0 && <a href="#" onClick={downloadAll}>Toplu İndir</a>}{invoices.length > 0 && <a href="#" onClick={downloadAll}>Excel İndir</a>}</td>
          </tr>


        </tbody>
      </table>
</div>
    </section>
  );
}
