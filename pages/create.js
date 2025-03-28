import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import DateSelector from '../components/DateSelector';

export default function CreatePoll() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const docRef = await addDoc(collection(db, 'polls'), {
      name,
      email,
      title,
      location,
      preferredDate,
      dates: selectedDates.map(date => format(date, 'yyyy-MM-dd')),
      createdAt: Timestamp.now()
    });

    router.push(`/poll/${docRef.id}`);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Suggest dates for your Evening Out 🍸</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full border p-2" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
        <input className="w-full border p-2" type="email" placeholder="Your email (for updates)" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border p-2" type="text" placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} required />
        <input className="w-full border p-2" type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} required />

        <label className="block mt-4 font-semibold">Pick your dates:</label>
        <DateSelector selectedDates={selectedDates} setSelectedDates={setSelectedDates} />

        <label className="block mt-4 font-semibold">Preferred date (optional):</label>
        <input className="w-full border p-2" type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} />

        <button type="submit" className="w-full bg-black text-white py-2 mt-4">Create Poll</button>
      </form>
    </div>
  );
}
