import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tourPackage: '',
    travelers: '1',
    message: ''
  });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tours = [
    {
      id: 'japan',
      name: 'Japan Cherry Blossom',
      duration: '7 วัน 6 คืน',
      price: '59,900',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      highlights: ['โตเกียว', 'เกียวโต', 'โอซาก้า', 'ฟูจิ']
    },
    {
      id: 'switzerland',
      name: 'Switzerland Alps',
      duration: '8 วัน 7 คืน',
      price: '129,900',
      image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      highlights: ['ซูริค', 'ลูเซิร์น', 'อินเทอร์ลาเคน', 'เซอร์แมท']
    },
    {
      id: 'maldives',
      name: 'Maldives Paradise',
      duration: '5 วัน 4 คืน',
      price: '45,900',
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
      highlights: ['รีสอร์ทหรู', 'ดำน้ำ', 'สปา', 'พระอาทิตย์ตก']
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', tourPackage: '', travelers: '1', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Head>
        <title>Wanderlust Tours | ทัวร์คุณภาพ ราคาดี</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Sarabun:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        :root {
          --gold: #c9a959;
          --gold-light: #e8d5a3;
          --dark: #1a1a1a;
          --darker: #0d0d0d;
          --cream: #f5f0e6;
        }
        
        body {
          font-family: 'Sarabun', sans-serif;
          background: var(--darker);
          color: var(--cream);
          overflow-x: hidden;
        }
        
        h1, h2, h3 {
          font-family: 'Playfair Display', serif;
        }
      `}</style>

      <style jsx>{`
        .hero {
          min-height: 100vh;
          background: linear-gradient(135deg, rgba(13,13,13,0.9) 0%, rgba(26,26,26,0.8) 100%),
                      url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920') center/cover;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 2rem;
          position: relative;
        }
        
        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at center, transparent 0%, var(--darker) 70%);
          pointer-events: none;
        }
        
        .hero-content {
          position: relative;
          z-index: 1;
          animation: fadeUp 1s ease-out;
        }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .logo {
          font-size: 1rem;
          letter-spacing: 8px;
          color: var(--gold);
          margin-bottom: 2rem;
          text-transform: uppercase;
        }
        
        .hero h1 {
          font-size: clamp(3rem, 10vw, 7rem);
          font-weight: 400;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, var(--cream) 0%, var(--gold-light) 50%, var(--gold) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .tagline {
          font-size: 1.3rem;
          font-weight: 300;
          color: var(--gold-light);
          margin-bottom: 3rem;
          letter-spacing: 2px;
        }
        
        .cta-btn {
          padding: 1.2rem 3rem;
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          background: transparent;
          border: 1px solid var(--gold);
          color: var(--gold);
          cursor: pointer;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        
        .cta-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: var(--gold);
          transition: left 0.4s ease;
          z-index: -1;
        }
        
        .cta-btn:hover {
          color: var(--darker);
        }
        
        .cta-btn:hover::before {
          left: 0;
        }
        
        .scroll-hint {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          animation: bounce 2s infinite;
          color: var(--gold);
          font-size: 0.8rem;
          letter-spacing: 2px;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(10px); }
        }
        
        .tours-section {
          padding: 6rem 2rem;
          background: var(--dark);
        }
        
        .section-title {
          text-align: center;
          margin-bottom: 4rem;
        }
        
        .section-title h2 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 1rem;
        }
        
        .section-title .line {
          width: 60px;
          height: 1px;
          background: var(--gold);
          margin: 0 auto;
        }
        
        .tours-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .tour-card {
          position: relative;
          height: 500px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.5s ease;
        }
        
        .tour-card:hover {
          transform: scale(1.02);
        }
        
        .tour-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s ease;
        }
        
        .tour-card:hover img {
          transform: scale(1.1);
        }
        
        .tour-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(13,13,13,0.95) 0%, rgba(13,13,13,0.3) 50%, transparent 100%);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        
        .tour-card h3 {
          font-size: 1.8rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
          color: var(--cream);
        }
        
        .tour-duration {
          color: var(--gold);
          font-size: 0.9rem;
          letter-spacing: 2px;
          margin-bottom: 1rem;
        }
        
        .tour-highlights {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .tour-highlights span {
          padding: 0.3rem 0.8rem;
          border: 1px solid rgba(201,169,89,0.3);
          font-size: 0.8rem;
          color: var(--gold-light);
        }
        
        .tour-price {
          font-size: 1.5rem;
          color: var(--gold);
        }
        
        .tour-price small {
          font-size: 0.9rem;
          color: var(--cream);
          opacity: 0.7;
        }
        
        .book-btn {
          margin-top: 1rem;
          padding: 0.8rem 2rem;
          background: var(--gold);
          border: none;
          color: var(--darker);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 0.85rem;
        }
        
        .book-btn:hover {
          background: var(--gold-light);
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 2rem;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal {
          background: var(--dark);
          max-width: 500px;
          width: 100%;
          padding: 3rem;
          position: relative;
          border: 1px solid rgba(201,169,89,0.2);
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.4s ease;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .modal h2 {
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
          color: var(--cream);
        }
        
        .modal-subtitle {
          color: var(--gold);
          margin-bottom: 2rem;
          font-size: 0.9rem;
          letter-spacing: 2px;
        }
        
        .close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: none;
          border: none;
          color: var(--cream);
          font-size: 1.5rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.3s;
        }
        
        .close-btn:hover {
          opacity: 1;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--gold-light);
          font-size: 0.9rem;
          letter-spacing: 1px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 1rem;
          background: var(--darker);
          border: 1px solid rgba(201,169,89,0.3);
          color: var(--cream);
          font-family: 'Sarabun', sans-serif;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--gold);
        }
        
        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .submit-btn {
          width: 100%;
          padding: 1.2rem;
          background: var(--gold);
          border: none;
          color: var(--darker);
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .submit-btn:hover {
          background: var(--gold-light);
        }
        
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .status-message {
          margin-top: 1rem;
          padding: 1rem;
          text-align: center;
        }
        
        .status-success {
          background: rgba(39,174,96,0.2);
          color: #27ae60;
          border: 1px solid rgba(39,174,96,0.3);
        }
        
        .status-error {
          background: rgba(231,76,60,0.2);
          color: #e74c3c;
          border: 1px solid rgba(231,76,60,0.3);
        }
        
        .footer {
          padding: 3rem 2rem;
          text-align: center;
          background: var(--darker);
          border-top: 1px solid rgba(201,169,89,0.1);
        }
        
        .footer p {
          color: var(--gold-light);
          opacity: 0.6;
          font-size: 0.9rem;
        }
      `}</style>

      <section className="hero">
        <div className="hero-content">
          <div className="logo">✦ Wanderlust Tours ✦</div>
          <h1>Explore<br/>The World</h1>
          <p className="tagline">ค้นพบประสบการณ์การเดินทางที่ไม่เหมือนใคร</p>
          <button className="cta-btn" onClick={() => document.getElementById('tours').scrollIntoView({ behavior: 'smooth' })}>
            ดูแพ็กเกจทัวร์
          </button>
        </div>
        <div className="scroll-hint">เลื่อนลง</div>
      </section>

      <section className="tours-section" id="tours">
        <div className="section-title">
          <h2>แพ็กเกจยอดนิยม</h2>
          <div className="line"></div>
        </div>
        
        <div className="tours-grid">
          {tours.map((tour) => (
            <div key={tour.id} className="tour-card">
              <img src={tour.image} alt={tour.name} />
              <div className="tour-overlay">
                <h3>{tour.name}</h3>
                <div className="tour-duration">{tour.duration}</div>
                <div className="tour-highlights">
                  {tour.highlights.map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>
                <div className="tour-price">
                  ฿{tour.price} <small>/ ท่าน</small>
                </div>
                <button 
                  className="book-btn"
                  onClick={() => {
                    setFormData({ ...formData, tourPackage: tour.name });
                    setShowForm(true);
                  }}
                >
                  จองทัวร์นี้
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            <h2>จองทัวร์</h2>
            <p className="modal-subtitle">กรอกข้อมูลเพื่อจองทัวร์</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>อีเมล *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>แพ็กเกจทัวร์ *</label>
                <select
                  required
                  value={formData.tourPackage}
                  onChange={(e) => setFormData({ ...formData, tourPackage: e.target.value })}
                >
                  <option value="">เลือกแพ็กเกจ</option>
                  {tours.map((tour) => (
                    <option key={tour.id} value={tour.name}>{tour.name} - ฿{tour.price}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>จำนวนผู้เดินทาง</label>
                <select
                  value={formData.travelers}
                  onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n} ท่าน</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>ข้อความเพิ่มเติม</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="วันที่ต้องการเดินทาง, คำถาม, หรือความต้องการพิเศษ..."
                />
              </div>
              
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อมูลจอง'}
              </button>
              
              {status === 'success' && (
                <div className="status-message status-success">
                  ✓ ส่งข้อมูลสำเร็จ! เราจะติดต่อกลับโดยเร็วที่สุด
                </div>
              )}
              
              {status === 'error' && (
                <div className="status-message status-error">
                  ✗ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>© 2025 Wanderlust Tours. All rights reserved.</p>
      </footer>
    </>
  );
}
