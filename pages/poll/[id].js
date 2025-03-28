import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';

import WhatsAppShareButton from '../../components/WhatsAppShareButton';

<WhatsAppShareButton
  url={typeof window !== 'undefined' ? window.location.href : ''}
  message={`Vote for your best date for a night out 🍷`}
/>

export default function PollVotePage() {
  const router = useRouter();
  const { id } = router.query;

  const [poll, setPoll] = useState(null);
  const [name, setName] = useState('');
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPoll = async () => {
      const docRef = doc(db, 'polls', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPoll({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };

    fetchPoll();
  }, [id]);

  const handleVoteChange = (date, value) => {
    setVotes((prev) => ({
      ...prev,
      [date]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addDoc(collection(db, 'polls', id, 'votes'), {
      name,
      votes,
      createdAt: Timestamp.now()
    });

    alert('Vote submitted!');
    router.push(`/results/${id}`);
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (!poll) return <p className="p-4">Poll not found</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{poll.title}</h1>
      <p className="text-gray-700 mb-2">{poll.location}</p>
      <p className="text-sm text-gray-500 mb-4">Hosted by {poll.name}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {poll.dates.map((date) => {
          const formatted = format(parseISO(date), 'EEEE do MMMM yyyy');
          return (
            <div key={date} className="border p-3 rounded">
              <div className="font-semibold mb-2">{formatted}</div>
              <div className="flex gap-6">
                <label>
                  <input
                    type="radio"
                    name={date}
                    value="best"
                    checked={votes[date] === 'best'}
                    onChange={() => handleVoteChange(date, 'best')}
                  />{' '}
                  ✅ Best
                </label>
                <label>
                  <input
                    type="radio"
                    name={date}
                    value="maybe"
                    checked={votes[date] === 'maybe'}
                    onChange={() => handleVoteChange(date, 'maybe')}
                  />{' '}
                  🤔 Maybe
                </label>
                <label>
                  <input
                    type="radio"
                    name={date}
                    value="no"
                    checked={votes[date] === 'no'}
                    onChange={() => handleVoteChange(date, 'no')}
                  />{' '}
                  ❌ No
                </label>
              </div>
            </div>
          );
        })}

        <button
          type="submit"
          className="w-full bg-black text-white py-2 mt-4 rounded"
        >
          Submit Vote
        </button>
      </form>
    </div>
  );
}
