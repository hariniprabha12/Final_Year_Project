import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractMedicalEntities } from './groqApi';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


function LiveTranscription() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, email, age, gender } = location.state || { name: '', email: '', age: '', gender: '' };


  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [entities, setEntities] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProceedForm, setShowProceedForm] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          finalTranscript += event.results[i][0].transcript;
        }
        setTranscript(finalTranscript);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
  };

  const handleExtractClick = async () => {
    if (!transcript) {
      alert('Please transcribe something first!');
      return;
    }
    setLoading(true);
    const result = await extractMedicalEntities(transcript);
    setEntities(result);
    setLoading(false);
  };

  // Map Duration to each Drug
  const mapDurationToDrugs = () => {
    const drugs = Array.isArray(entities.Drug) ? entities.Drug : [entities.Drug];
    const durations = entities.Duration ? entities.Duration.split(',') : [];

    // If there are more durations than drugs, we slice the excess durations
    const mappedDurations = drugs.map((drug, index) => {
      return {
        drug,
        duration: durations[index] || durations[0] || '—' // Default to first duration or '—' if none
      };
    });

    return mappedDurations;
  };

  const generatePDF = (name, email, entities, drugData) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(65);
    doc.setFont("helvetica", "bold");
    doc.text("Rx", 35, 32);
    // Patient Info
    doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${name || '—'}`, 100, 15);
  doc.text(`Email: ${email || '—'}`, 100, 22);
  doc.text(`Age: ${age || '—'}`, 100, 29);
  doc.text(`Gender: ${gender || '—'}`, 100, 36);
  doc.setLineWidth(0.5);
  doc.line(14, 52, 200, 52);

  // Symptom Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Symptom:", 14, 65);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
    doc.text(` ${entities.Symptom || '—'}`, 14, 75);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Prescription Details:", 14, 85);

    // Table
    autoTable(doc, {
      startY: 90,
      head: [['S.No', 'Drug', 'Form', 'Strength', 'Frequency', 'Time', 'Duration']],
      body: drugData.map((item, index) => [
        index + 1,
        item.drug || '—',
        entities.Form || '—',
        entities.Strength || '—',
        entities.Frequency || '—',
        entities.Time || '—',
        item.duration || '—',
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [128, 128, 128] }
,
    });
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    // Get the current date and time
const currentDateTime = new Date();

// Format it as a string
const formattedDateTime = currentDateTime.toLocaleString();

// Print it in the desired position
doc.text("Date and time: " + formattedDateTime, 14, pageHeight - 15);

    doc.text("SIGNATURE", 160, pageHeight - 15);
    // Open the PDF in a new tab
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl);
  };
  return (
    <header className="hero">
      <div className="form-box-container">
        {/* Left Box */}
        <div className="form-box" style={{ position: 'relative' }}>
          <div className="back-button" onClick={() => navigate('/patient-form')}>←</div>
          <h2 className="transcript-header">Live Transcription</h2>
          <div className="transcript-box">
          <div className="input-group-horizontal">
            <label>Name:</label>
            <span>{name}</span>
          </div>
          <div className="input-group-horizontal">
            <label>Email:</label>
            <span>{email}</span>
          </div>
          <div className="input-group-horizontal">
            <label>Age:</label>
            <span>{age || '—'}</span>
          </div>
          <div className="input-group-horizontal">
            <label>Gender:</label>
            <span>{gender || '—'}</span>
          </div>
          </div>
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button className="record-btn" onClick={listening ? stopListening : startListening}>
              {listening ? 'Stop' : 'Record'}
            </button>
          </div>
          <div style={{ width: '100%' }}>
            <p className="transcript-label">Transcript:</p>
            <div className="transcript-box">
              {transcript || <span style={{ color: '#ccc' }}>Transcript will appear here...</span>}
            </div>
          </div>
          <button
            className="extract-btn"
            style={{ position: 'absolute', bottom: '20px', right: '20px' }}
            onClick={handleExtractClick}
            disabled={loading}
          >
            {loading ? 'Extracting...' : 'Extract'}
          </button>
        </div>

        {/* Right Box */}
        <div className="form-box">
          <h2 className="transcript-header">Extracted Entities</h2>
          <div style={{ width: '100%' }}>
            <p className="transcript-label">Entities:</p>
            <div className="transcript-box">
              {entities ? (
                <>
                  <div className="input-group-horizontal">
                    <label>Intent of speech:</label>
                    <span>{entities["Intent of speech"] || '—'}</span>
                  </div>
                  <div className="input-group-horizontal">
                    <label>Symptom:</label>
                    <span>{entities.Symptom || '—'}</span>
                  </div>
                  <div className="input-group-horizontal">
                    <label>Drug:</label>
                    <span>{Array.isArray(entities.Drug) ? entities.Drug.join(', ') : '—'}</span>
                  </div>
                  <div className="input-group-horizontal">
                    <label>Strength:</label>
                    <span>{entities.Strength || '—'}</span>
                  </div>
                  <div className="input-group-horizontal">
                    <label>Form:</label>
                    <span>{entities.Form || '—'}</span>
                  </div>
                  <div className="input-group-horizontal">
                    <label>Frequency:</label>
                    <span>{entities.Frequency || '—'}</span>
                  </div>
                  <div className="input-group-horizontal">
                    <label>Duration:</label>
                    <span>{entities.Duration || '—'}</span>
                  </div>
                  <div className="input-group-horizontal">
                    <label>Time:</label>
                    <span>{entities.Time || '—'}</span>
                  </div>
                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      className="extract-btn"
                      onClick={() => setShowProceedForm(true)} // Open modal popup
                    >
                      Proceed
                    </button>
                  </div>
                </>
              ) : (
                <span style={{ color: '#ccc' }}>Entities will be shown here...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Popup for Tabular View */}
      {showProceedForm && (
        <div className="form-modal">
          <div className="form-box">
            <span className="back-button" onClick={() => setShowProceedForm(false)}>←</span>
            <h2 className="transcript-header">Extracted Data</h2>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table className="entity-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Drug</th>
                    <th>Form</th>
                    <th>Strength</th>
                    <th>Frequency</th>
                    <th>Time</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {mapDurationToDrugs().map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.drug || '—'}</td>
                      <td>{entities.Form || '—'}</td>
                      <td>{entities.Strength || '—'}</td>
                      <td>{entities.Frequency || '—'}</td>
                      <td>{entities.Time || '—'}</td>
                      <td>{item.duration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
  <button className="action-btn" onClick={() => generatePDF(name, email, entities, mapDurationToDrugs())}>
    Generate PDF
  </button>
  <button className="action-btn" onClick={() => generatePDF(name, email, entities, mapDurationToDrugs())}>
    Proceed
  </button>
</div>





          </div>
        </div>
      )}
    </header>
  );
}

export default LiveTranscription;
