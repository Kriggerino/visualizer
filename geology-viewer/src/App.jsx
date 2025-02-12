import { useState } from 'react';
import Viewer2D from './components/Viewer2D';
import Viewer3D from './components/Viewer3D';
import SectionSelector from './components/SectionSelector';
import styles from './styles/App.module.css';

function App() {
  const [selectedSection, setSelectedSection] = useState('');
  const [data, setData] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          setData(jsonData);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Error reading file. Please ensure it is a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Geology Viewer</h1>
      
      {!data && (
        <div className={styles.upload}>
          <input 
            type="file" 
            accept=".json"
            onChange={handleFileUpload}
            className={styles.fileInput}
          />
        </div>
      )}

      {data && (
        <>
          <SectionSelector 
            sections={data.polygonsBySection} 
            onSelect={setSelectedSection}
            value={selectedSection}
          />

          <div className={styles.viewersContainer}>
            <div className={styles.viewer}>
              <h2>2D View</h2>
              <Viewer2D 
                data={data} 
                selectedSection={selectedSection} 
              />
            </div>

            <div className={styles.viewer}>
              <h2>3D View</h2>
              <Viewer3D data={data} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default App;
