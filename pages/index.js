import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import DateSelector from '../components/DateSelector';
import MapboxAutocomplete from '../components/MapboxAutocomplete';

export default function Home() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(''); // Location state
  const [selectedDates, setSelectedDates] = useState([]);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedDates = selectedDates.map(date => format(date, 'yyyy-MM-dd'));

    // Save poll to Firestore
    const docRef = await addDoc(collection(db, 'polls'), {
      organiserFirstName: firstName,
      organiserLastName: lastName,
      organiserEmail: email,
      title,
      location, // Pass the selected location
      dates: formattedDates,
      createdAt: Timestamp.now(),
    });

    // Redirect to the newly created poll
    router.push(`/poll/${docRef.id}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-6">
        <h1 className="text-2xl font-bold mb-5 text-center">
          🍸 Evening Out Planner 🍸
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              className="w-1/2 border p-2 rounded"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              className="w-1/2 border p-2 rounded"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <input
            type="email"
            className="w-full border p-2 rounded"
            placeholder="Your email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Location Picker */}
          <MapboxAutocomplete setLocation={setLocation} />

          <label className="block font-semibold mt-4 text-center">
            Pick your dates:
          </label>
          <div className="flex justify-center">
            <DateSelector
              selectedDates={selectedDates}
              setSelectedDates={setSelectedDates}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white font-semibold py-2 mt-4 rounded"
          >
            Create Planner
          </button>
        </form>
      </div>
    </div>
  );
}
