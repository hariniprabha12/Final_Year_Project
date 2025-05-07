import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PatientFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const navigate = useNavigate();

  const handleRecord = () => {
    navigate('/record', {
      state: {
        name,
        email,
        age,
        gender
      }
    });
  };

  return (
    <header className="hero">
      <div className="form-box">
        <h2>Enter Patient Details</h2>

        <div className="input-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="age">Age:</label>
          <input
            type="number"
            id="age"
            placeholder="Your Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <div className="input-group">
  <label htmlFor="gender">Gender:</label>
  <select
    id="gender"
    value={gender}
    onChange={(e) => setGender(e.target.value)}
  >
    <option value="" disabled hidden>
      Select Gender
    </option>
    <option value="Female">Female</option>
    <option value="Male">Male</option>
  </select>
</div>


        <button className="record-btn" onClick={handleRecord}>
          Record
        </button>
      </div>
    </header>
  );
}

export default PatientFormPage;
