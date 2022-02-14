import React, { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';

import { BsFillFileTextFill } from "react-icons/bs";

import background from '../images/bg.png';
import logo from '../images/xml-fatura-logo.png';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',

  borderRadius: 10,

  // boxShadow: "1px 3px 1px rgba(0, 0, 0, 0.1)",
  backgroundColor: 'rgba(230, 230, 230, 0.5)',
  backdropFilter: 'blur(16px)',
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



  return (
    <>
        <div className=' p-5 ' style={{ backgroundImage: `url(${background})`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover', textAlign: 'center', height: '100vh' }}>

          <img className='d-none d-md-block d-lg-block' src={logo} alt="" height={40} style={{ position: 'absolute', left: 50, top: 20 }} />
          <h1 style={{ color: 'white' }}> XML Fatura <br /> Görüntüleyici </h1>
          <div className='p-2 container' style={{
            borderWidth: 2,
            borderRadius: 10,
            borderColor: 'white',
            borderStyle: 'dashed',
          }}>
            <div className='shadow dropzone' {...getRootProps({ style })}>
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

    </>
  );
}
