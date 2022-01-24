import React, { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ReactTooltip from "react-tooltip";
import { FaEye, FaDownload, FaPrint, FaTrash, FaCheckCircle } from "react-icons/fa";
import ExportJsonExcel from 'js-export-excel';
import AnimationData from '../lf30_editor_xemc1wj7.json';
import LottieLoader from 'react-lottie-loader';
import { Card, Modal, Button, Row, Col, Container } from 'react-bootstrap';

import { toast } from 'react-toastify';
import { BsFillFileTextFill } from "react-icons/bs";

import background from '../images/bg.png';
import logo from '../images/xml-fatura-logo.png';

function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    var fr = new FileReader();
    fr.onload = () => {
      resolve(fr.result)
    };
    fr.onerror = reject;
    fr.readAsText(file);
  });
}
function readFileBuffer(file) {
  return new Promise((resolve, reject) => {
    var fr = new FileReader();
    fr.onload = () => {
      resolve(fr.result)
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

  borderRadius: 10,

  // boxShadow: "1px 3px 1px rgba(0, 0, 0, 0.1)",
  backgroundColor: 'rgba(230, 230, 230, 0.5)',
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

  const xmlUrl = URL.createObjectURL(
    new Blob([contents], { type: "text/xml;charset=utf-8;" })
  );

  // var frog = window.open(winUrl,  '_blank'); //,"location=no,menubar=no,scrollbars=no,status=no")
  // frog.print();

  // setTimeout(function () { frog.print(); }, 1);
  // frog.onfocus = function () { setTimeout(function () { frog.close(); }, 500); }
  // frog.close();
  // frog.print();

  const time = xmlDoc.querySelector("Invoice>IssueTime");
  var t = null;
  if (time) {
    t = time.innerHTML;
  }

  var seller = xmlDoc.querySelector("Invoice>AccountingSupplierParty>Party")

  var sellerID = null;
  var sellerName = null;

  var notesOut = "";
  var notes = xmlDoc.querySelectorAll("Invoice>Note")

  for (var i = 0; i < notes.length; ++i) {
    const note = notes[i];

    const content = note.innerHTML;

    if (!content.startsWith("#")) {
      notesOut += (note.innerHTML + "\n");
    }
  }

  notesOut = notesOut.trim();


  if (seller) {
    sellerID = seller.querySelector("PartyIdentification>ID[schemeID=\"VKN\"],PartyIdentification>ID[schemeID=\"TCKN\"]").innerHTML;
    console.log(seller);
    sellerName = seller.querySelector("PartyName>Name")?.innerHTML;

    if (!sellerName) {
      sellerName = seller.querySelector("Person>FirstName")?.innerHTML + " " + seller.querySelector("Person>FamilyName")?.innerHTML;
    }
  } else {
    console.log("Error: Seller not found", path);
    return;
  }

  const lines = xmlDoc.querySelectorAll("Invoice>InvoiceLine");


  var outLines = [];

  for (var i = 0; i < lines.length; ++i) {
    const line = lines[i];

    const id = line.querySelector("ID").innerHTML;
    const amount = parseFloat(line.querySelector("InvoicedQuantity").innerHTML);
    const unit = line.querySelector("InvoicedQuantity").attributes["unitCode"]?.value;
    const name = line.querySelector("Item>Name").innerHTML;
    const description = line.querySelector("Item>Description")?.innerHTML;
    const price = parseFloat(line.querySelector("Price>PriceAmount").innerHTML);
    const priceUnit = line.querySelector("Price>PriceAmount").attributes["currencyID"]?.value;
    const totalPrice = parseFloat(line.querySelector("LineExtensionAmount").innerHTML);
    const totalPriceUnit = line.querySelector("LineExtensionAmount").attributes["currencyID"]?.value;


    const taxData = line.querySelector("TaxTotal");

    var tax = null;
    if (taxData) {

      const taxName = taxData.querySelector("TaxSubtotal>TaxCategory>TaxScheme>Name")?.innerHTML;
      const taxAmount = taxData.querySelector("TaxAmount").innerHTML;
      const taxRate = taxData.querySelector("TaxSubtotal>Percent").innerHTML;
      tax = {
        taxName, taxAmount, taxRate
      }
    }


    outLines.push({
      id, amount, unit, name, description, price, priceUnit, tax, totalPrice, totalPriceUnit
    });
  }
  return {
    path: path,
    id: xmlDoc.querySelector("Invoice>ID").innerHTML,
    UUID: xmlDoc.querySelector("Invoice>UUID").innerHTML,
    profile: xmlDoc.querySelector("Invoice>ProfileID").innerHTML,
    type: xmlDoc.querySelector("Invoice>InvoiceTypeCode").innerHTML,
    blob: winUrl,
    contents: blob,
    notes: notesOut,
    xmlUrl,
    lines: outLines,
    original: contents,
    sellerID,
    sellerName,
    buyerID: xmlDoc.querySelector("Invoice>AccountingCustomerParty>Party>PartyIdentification>ID[schemeID=\"VKN\"],Invoice>AccountingCustomerParty>Party>PartyIdentification>ID[schemeID=\"TCKN\"]").innerHTML,
    buyerName: xmlDoc.querySelector("Invoice>AccountingCustomerParty>Party>PartyName>Name").innerHTML,
    total: parseFloat(xmlDoc.querySelector("Invoice>LegalMonetaryTotal>TaxExclusiveAmount").innerHTML),
    totalWithTax: parseFloat(xmlDoc.querySelector("Invoice>LegalMonetaryTotal>TaxInclusiveAmount").innerHTML),
    issueDate: xmlDoc.querySelector("Invoice>IssueDate").innerHTML,
    issueTime: t,
    payableAmount: xmlDoc.querySelector("Invoice>LegalMonetaryTotal>PayableAmount").innerHTML,
    digestValue: xmlDoc.querySelector("UBLExtension>ExtensionContent>Signature>SignedInfo>Reference[URI='']>DigestValue").innerHTML,
  }
}

const formatPrice = (price, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency
  }).format(price);
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
  } = useDropzone({ accept: ['text/xml', 'application/zip', 'application/x-zip-compressed', 'multipart/x-zip'], maxFiles: 100 });

  const [files, setFiles] = React.useState([]);
  const [invoices, setInvoices] = React.useState([]);

  const [numLoad, setNumLoad] = React.useState(0);

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

    if (files.length === 0) {
      return;
    }

    // setNumLoad(files.length);

    Promise.all(files.map(async file => {
      if (file.type === "text/xml") {
        setNumLoad(d => d + 1);
        const f = xmltohtml(file.path, await readFile(file));
        setNumLoad(d => d - 1);
        return f
      } else if (file.type === "application/zip" || file.type === "application/x-zip-compressed" || file.type === "multipart/x-zip") {
        const fileBuffer = await readFileBuffer(file);

        const zip = await JSZip.loadAsync(fileBuffer)


        window.zip = zip;

        const out = await Promise.all(Object.keys(zip.files).map(async (k) => {
          const file = zip.files[k];

          if (file.name.endsWith(".xml")) {
            setNumLoad(d => d + 1);
            const data = xmltohtml(file.name, await file.async("text"));
            setNumLoad(d => d - 1);
            return data;
          }
        }));

        return out;
      } else {
        return null;
      }
    })).then(res => {

      const resfiltered = res.flat(1).filter(res => res);
      const existingInvoices = invoices.filter(inv => !resfiltered.find(r => inv.id === r.id));

      console.log(resfiltered);

      setInvoices([...existingInvoices, ...resfiltered]);
      setFiles([]);
    });

  }, [files])
  const [showInvoice, setShowInvoice] = React.useState(null);
  const handleClose = () => setShowInvoice(null);

  const printBlob = (e, blob) => {
    e.preventDefault();

    var frog = window.open(blob, '_blank'); //,"location=no,menubar=no,scrollbars=no,status=no")
    frog.document.title = "Invoice";
    frog.print();
    setTimeout(function () { frog.close(); }, 500);
  }


  const downloadExcel = (e) => {
    e.preventDefault();
    const data = invoices.map(inv => {
      return {
        id: inv.id,
        satici: inv.sellerName,
        saticiId: inv.sellerID,
        alici: inv.buyerName,
        aliciId: inv.buyerID,
        tarih: inv.issueDate,
        saat: inv.issueTime,
        toplam: `${inv.total} TRY`,
        vergiler: `${inv.totalWithTax - inv.total} TRY`,
      }
    });

    var option = {};

    option.fileName = "excel";

    option.saveAsBlob = true;

    option.datas = [
      {
        sheetData: data,
        sheetName: "Faturalar",
        sheetFilter: ["id", "satici", "saticiId", "alici", "aliciId", "tarih", "saat", "toplam", "vergiler"],
        sheetHeader: ["Fatura No", "Satıcı", "Satıcı VKN/TCKN", "Alıcı", "Alıcı VKN/TCKN", "Düzenleme Tarihi", "Düzenleme Saati", "Toplam", "Vergi"]
      },
      {
        sheetData: data,
      }
    ];

    var toExcel = new ExportJsonExcel(option);

    let file = toExcel.saveExcel();


    saveAs(file, "invoices.xlsx");
    toast("Raporunuz İndirilmeye Başladı");

    return false;

  }


  const downloadAll = (e) => {
    e.preventDefault();
    const zipFile = new JSZip();


    invoices.forEach(invoice => {
      const [year, month, day] = invoice.issueDate.split('-');

      zipFile.file(`${year}/${month}/${day}/${invoice.UUID}.html`, invoice.contents);
      zipFile.file(`${year}/${month}/${day}/${invoice.UUID}.xml`, invoice.original);


    });
    zipFile.generateAsync({ type: "blob" })
      .then(function (content) {
        // see FileSaver.js
        saveAs(content, "Faturalar.zip");
        toast("Faturalarınız İndirilmeye Başladı");
      });

    return false;
  }

  const copyText = (e, data, message) => {
    e.preventDefault();
    var data = [new window.ClipboardItem({ "text/plain": new Blob([data], { type: "text/plain" }) })];
    navigator.clipboard.write(data).then(function () {
      console.log("Copied to clipboard successfully!");
      toast(message, {});
    }, function () {
      console.error("Unable to write to clipboard. :-(");
    });

    return false;

  }

  const {
    total,
    totalWithTax
  } = React.useMemo(() => {
    return {
      total: invoices.reduce((v, i) => v + i.total, 0),
      totalWithTax: invoices.reduce((v, i) => v + i.totalWithTax, 0),
    }
  }, [invoices]);

  return (
    <>
      <section className='container-fluid'>
        <div className=' p-5 mt-2 ' style={{ backgroundImage: `url(${background})`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover', borderRadius: 5, textAlign: 'center' }}>

        <img className='d-none d-md-block d-lg-block' src= {logo} alt="" height={40} style={{position:'absolute', left:50, top:20}}/> 
          <h1 style={{ color: 'white' }}> XML Fatura <br /> Dönüştürücüsü </h1>
          <div className='p-2 mt-4 container' style={{
            borderWidth: 2,
            borderRadius: 10,
            borderColor: 'white',
            borderStyle: 'dashed',
          }}>
            <div className='shadow' {...getRootProps({ style })}>
              <input {...getInputProps()} />
              <BsFillFileTextFill style={{ color: '#3789DB', fontSize: 84, backgroundColor: 'white', borderRadius: '50%', padding: 15 }} />
              <h2>Dosya Seçim Alanı</h2>
              <h5>.XML ile biten e-fatura veya e-arşiv faturalarınız buraya sürükleyin.</h5>
              {/* <small>Dosyaları elle seçmek için buraya tıklayabilirsiniz. </small> */}
              <p>Birden fazla xml dosyasını hızlıca yüklemek için bir zip dosyası halinde de yükleyebilirsiniz.</p>
              {/* <br /> Zip dosyasının içindeki bütün .xml ile biten dosyalar taranacaktır. <br />
                Seçtiğiniz hiç bir dosya bilgisayarınızdan ayrılmayacaktır! Herhangi bir sunucuya yüklenmeyecektir!</p> */}
            </div>
          </div>
        </div>
        {/* <aside>
        <h4>Accepted files</h4>
        <ul>{acceptedFileItems}</ul>
        <h4>Rejected files</h4>
        <ul>{fileRejectionItems}</ul>
      </aside> */}
        {invoices.length ?
          numLoad ? (
            <div style={{ width: '200px', margin: 'auto', textAlign: 'center' }}>
              <LottieLoader animationData={AnimationData} />
              <h2>Faturalarınız Yükleniyor {numLoad}</h2>
            </div>
          ) : (

            <>

              {/* <h2 className={"mt-4"}> İşlenen Faturalar </h2> */}

              <div>
              <div  className='container-fluid'>
                {invoices.map(i => (
                
                    <div key={i.UUID} className='row border-bottom shadow-sm mt-2 mb-2 justify-content-center align-items-center' style={{backgroundColor:'white', borderRadius:10}}>
                      <div className='col-md-2 col-sm-12'>
                        <Card.Title className={"text-left"} style={{ textAlign: 'left' }}><a href={"#"} onClick={e => copyText(e, i.id, "Fatura Numarası Panoya Kopyalandı!")}><code>#{i.id}</code></a> </Card.Title>
                        <b>{i.type} {i.profile}</b>
                      </div>
                      <div className='col-md-2 col-sm-12'>
                        Satıcı:<br/> <ReactTooltip id={`seller_${i.UUID}`}><span>VKN/TCKN: {i.sellerID}</span></ReactTooltip><a data-tip data-for={`seller_${i.UUID}`} onClick={(e) => copyText(e, i.sellerID, "Satıcı VKN/TCKN Panoya Kopyalandı")} href={"#"}>{i.sellerName}</a>
                      </div>
                      <div className='col-md-2 col-sm-12'>
                      Alıcı:<br/> <ReactTooltip id={`buyer_${i.UUID}`}><span>VKN/TCKN: {i.buyerID}</span></ReactTooltip><a data-tip data-for={`seller_${i.UUID}`} onClick={(e) => copyText(e, i.buyerID, "Alıcı VKN/TCKN Panoya Kopyalandı")} href={"#"}>{i.buyerName}</a>
                      </div>
                      <div className='col-md-2 col-sm-12'>
                      Düzenlenme Tarihi:<br/> {i.issueDate} {i.issueTime || ""}
                      </div>
                      <div className='col-md-2 col-sm-12'>
                      <p>Toplam: {formatPrice(i.total)}<br /> KDV: {formatPrice(i.totalWithTax - i.total)}<br /> Toplam + KDV: {formatPrice(i.totalWithTax)}</p>
                      </div>
                      <div className='col-md-2 col-sm-12 flex-md-row flex-sm-column pb-2'>
                      <ReactTooltip id={`verify_${i.UUID}`}><span>Gib Doğrulaması</span></ReactTooltip><a data-tip data-for={`verify_${i.UUID}`} className="btn btn-outline-secondary" target={`_blank`} href={i.type !== "EARSIV" ? `https://sorgu.efatura.gov.tr/eFaturaSrg/efaturasrg?SATICIVKN=${i.sellerID}&BIRIMKOD=${i.id.substr(0,3)}&SIRANO=${i.id.substr(3)}&ODTUTAR=${i.payableAmount}&FHASH=${encodeURIComponent(i.digestValue)}&REPTYPE=EFTRDOGRULAMA` : `https://sorgu.efatura.gov.tr/eFaturaSrg/efaturasrg?SATICIVKNTCKN=${i.sellerID}&ALICIVKNTCKN=${i.buyerID}&FATNO=${i.id}&ODTUTAR&TOPTUTAR&FATDUZTAR&REPTYPE=EARSVDOGRULAMA`}><FaCheckCircle /></a>
                 
                        <ReactTooltip id={`view_${i.UUID}`}><span>Görüntüle</span></ReactTooltip><a data-tip data-for={`view_${i.UUID}`} className="btn btn-outline-primary ms-1" target={i.UUID} href={i.blob}><FaEye /></a>
                        <ReactTooltip id={`download_${i.UUID}`}><span>İndir</span></ReactTooltip><a data-tip data-for={`download_${i.UUID}`} className="btn btn-outline-success ms-1" onClick={() => toast("İndirme Başlatıldı")} download={`${i.UUID}.html`} href={i.blob}><FaDownload /></a>
                        <ReactTooltip id={`xml_download_${i.UUID}`}><span>XML İndir</span></ReactTooltip><a data-tip data-for={`xml_download_${i.UUID}`} className="btn btn-outline-warning ms-2" onClick={() => toast("İndirme Başlatıldı")} download={`${i.UUID}.xml`} href={i.xmlUrl}><FaDownload /></a>
                        <ReactTooltip id={`print_${i.UUID}`}><span>Yazdır</span></ReactTooltip><a data-tip data-for={`print_${i.UUID}`} className="btn btn-outline-dark  ms-2" href={i.blob} onClick={e => printBlob(e, i.blob)}><FaPrint /></a>
                        <ReactTooltip id={`delete_${i.UUID}`}><span>Sil</span></ReactTooltip><a data-tip data-for={`delete_${i.UUID}`} className="btn btn-outline-danger ms-2" href={"#"} onClick={e => {
                          setInvoices(invoices.filter(invoice => invoice.id !== i.id))
                          toast("Fatura silindi")
                        }}><FaTrash /></a>
                      </div>                 
                    </div>
              
                ))}
              
              {/* <div>
                {invoices.map(i => (
                  <Card key={i.UUID}>
                    <Card.Body>
                      <Card.Title className={"text-left"} style={{ textAlign: 'left' }}><a href={"#"} onClick={e => copyText(e, i.id, "Fatura Numarası Panoya Kopyalandı!")}><code>#{i.id}</code></a> {i.type} {i.profile} </Card.Title>

                      <Card.Title className={"text-left"} style={{ textAlign: 'left' }}>Satıcı: <ReactTooltip id={`seller_${i.UUID}`}><span>VKN/TCKN: {i.sellerID}</span></ReactTooltip><a data-tip data-for={`seller_${i.UUID}`} onClick={(e) => copyText(e, i.sellerID, "Satıcı VKN/TCKN Panoya Kopyalandı")} href={"#"}>{i.sellerName}</a></Card.Title>
                      <Card.Title className={"text-left"} style={{ textAlign: 'left' }}>Alıcı: <ReactTooltip id={`buyer_${i.UUID}`}><span>VKN/TCKN: {i.buyerID}</span></ReactTooltip><a data-tip data-for={`seller_${i.UUID}`} onClick={(e) => copyText(e, i.buyerID, "Alıcı VKN/TCKN Panoya Kopyalandı")} href={"#"}>{i.buyerName}</a></Card.Title>
                      <Card.Subtitle className="mb-2 text-muted text-left" style={{ textAlign: 'left' }}>Düzenlenme Tarihi: {i.issueDate} {i.issueTime || ""}</Card.Subtitle>
                      <Card.Subtitle className="mb-2 text-left" style={{ textAlign: 'left' }}>Toplam: {formatPrice(i.total)}<br /> KDV: {formatPrice(i.totalWithTax - i.total)}<br /> Toplam + KDV: {formatPrice(i.totalWithTax)}</Card.Subtitle>

                      <div style={{ float: 'right', display: 'flex' }} className={"flex-sm-column flex-md-row"}>
                        <ReactTooltip id={`verify_${i.UUID}`}><span>Gib Doğrulaması</span></ReactTooltip><a data-tip data-for={`verify_${i.UUID}`} className="btn btn-outline-secondary" target={`_blank`} href={i.type !== "EARSIV" ? `https://sorgu.efatura.gov.tr/eFaturaSrg/efaturasrg?SATICIVKN=${i.sellerID}&BIRIMKOD=${i.id.substr(0,3)}&SIRANO=${i.id.substr(3)}&ODTUTAR=${i.payableAmount}&FHASH=${encodeURIComponent(i.digestValue)}&REPTYPE=EFTRDOGRULAMA` : `https://sorgu.efatura.gov.tr/eFaturaSrg/efaturasrg?SATICIVKNTCKN=${i.sellerID}&ALICIVKNTCKN=${i.buyerID}&FATNO=${i.id}&ODTUTAR&TOPTUTAR&FATDUZTAR&REPTYPE=EARSVDOGRULAMA`}><FaCheckCircle /></a>
                        <ReactTooltip id={`view_${i.UUID}`}><span>Görüntüle</span></ReactTooltip><a data-tip data-for={`view_${i.UUID}`} className="btn btn-outline-primary ms-2" target={i.UUID} href={i.blob}><FaEye /></a>
                        <ReactTooltip id={`download_${i.UUID}`}><span>İndir</span></ReactTooltip><a data-tip data-for={`download_${i.UUID}`} className="btn btn-outline-success ms-2" onClick={() => toast("İndirme Başlatıldı")} download={`${i.UUID}.html`} href={i.blob}><FaDownload /></a>
                        <ReactTooltip id={`xml_download_${i.UUID}`}><span>XML İndir</span></ReactTooltip><a data-tip data-for={`xml_download_${i.UUID}`} className="btn btn-outline-warning ms-2" onClick={() => toast("İndirme Başlatıldı")} download={`${i.UUID}.xml`} href={i.xmlUrl}><FaDownload /></a>
                        <ReactTooltip id={`print_${i.UUID}`}><span>Yazdır</span></ReactTooltip><a data-tip data-for={`print_${i.UUID}`} className="btn btn-outline-dark  ms-2" href={i.blob} onClick={e => printBlob(e, i.blob)}><FaPrint /></a>
                        <ReactTooltip id={`delete_${i.UUID}`}><span>Sil</span></ReactTooltip><a data-tip data-for={`delete_${i.UUID}`} className="btn btn-outline-danger ms-2" href={"#"} onClick={e => {
                          setInvoices(invoices.filter(invoice => invoice.id !== i.id))
                          toast("Fatura silindi")
                        }}><FaTrash /></a>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div> */}

                    <div className='row border-bottom shadow-sm mt-2 mb-2 justify-content-center align-items-center' style={{backgroundColor:'white', borderRadius:10}}>
                      <div className='col-md-12 pt-2 pb-2'>
                      <Card.Title>Toplam {invoices.length} Fatura</Card.Title>
                  <Card.Text>
                    Toplam: {formatPrice(total)} <br />
                    KDV: {formatPrice(totalWithTax - total)}<br />
                    Toplam + KDV: {formatPrice(totalWithTax)}
                  </Card.Text>
                  <Card.Link href={"#"} onClick={downloadExcel}>
                    Excel Rapor İndir
                  </Card.Link>
                  <Card.Link href={"#"} onClick={downloadAll}>
                    Tümünü İndir
                  </Card.Link>
                      </div>

                    </div>
                    </div>
                    </div>
              {/* <Card>
                <Card.Body>
                  <Card.Title>Toplam {invoices.length} Fatura</Card.Title>
                  <Card.Text>
                    Toplam: {formatPrice(total)} <br />
                    KDV: {formatPrice(totalWithTax - total)}<br />
                    Toplam + KDV: {formatPrice(totalWithTax)}
                  </Card.Text>
                  <Card.Link href={"#"} onClick={downloadExcel}>
                    Excel Rapor İndir
                  </Card.Link>
                  <Card.Link href={"#"} onClick={downloadAll}>
                    Tümünü İndir
                  </Card.Link>
                </Card.Body>
              </Card> */}
            </>
          ) : <div className='container-fluid' style={{ backgroundColor: '#F4F8FB' }}>
            <div className='container'>
              <Row className={"pt-4 pb-4 justify-content-center "} >

                <Col lg={4}>
                  <Card className='shadow-sm p-3 mb-2 bg-white ' style={{ height: '12rem', padding: 10, justifyContent: 'center', borderColor: 'white', borderRadius: 10 }}>
                    <h3>
                      Güvenli
                    </h3>
                    <p>
                      Tüm işlemler kendi bilgisayarınızda yapılır. Seçtiğiniz hiç bir dosya bir sunucuya aktarılmaz.
                    </p>
                  </Card>
                </Col>
                <Col lg={4}>
                  <Card className='shadow-sm p-3 mb-2 bg-white ' style={{ height: '12rem', padding: 10, justifyContent: 'center', borderColor: 'white', borderRadius: 10 }}>
                    <h3>
                      Hızlı
                    </h3>
                    <p>
                      İşlemler kendi bilgisayarınızda olduğu için işlemler tamamen kendi bilgisayarınızın hızına bağlıdır. İşlemleriniz için bir sunucuda sıra beklemezsiniz.
                    </p>
                  </Card>
                </Col>
                <Col lg={4}>
                  <Card className='shadow-sm p-3 mb-2 bg-white ' style={{ height: '12rem', padding: 10, justifyContent: 'center', borderColor: 'white', borderRadius: 10 }}>
                    <h3>
                      Ölçekli
                    </h3>
                    <p>
                      Faturalarınızı ekledikten sonra <b>Tümünü İndir</b> seçeneği ile istedğiniz formatte bütün faturalarınızı indirebilirsiniz!
                    </p>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>}

      </section>


      <Modal show={showInvoice !== null} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
