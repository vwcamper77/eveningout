import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';

export default function ResultsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [poll, setPoll] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reveal, setReveal] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const pollRef = doc(db, 'polls', id);
      const pollSnap = await getDoc(pollRef);
      if (!pollSnap.exists()) return;

      const votesRef = collection(db, 'polls', id, 'votes');
      const votesSnap = await getDocs(votesRef);

      const voteData = votesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      const pollData = { id: pollSnap.id, ...pollSnap.data() };
      setPoll(pollData);
      setVotes(voteData);

      // Timer logic: 2 days from poll.createdAt
      if (pollData.createdAt?.toDate) {
        const created = pollData.createdAt.toDate().getTime();
        const now = new Date().getTime();
        const diffInMs = now - created;
        const diffInHours = diffInMs / (1000 * 60 * 60);
        if (diffInHours >= 48) {
          setTimerExpired(true);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!poll) return <p className="p-4">Poll not found</p>;

  // Tally votes
  const voteSummary = poll.dates.map((date) => {
    const summary = { best: 0, maybe: 0, no: 0, date };
    votes.forEach((v) => {
      const response = v.votes[date];
      if (response) summary[response]++;
    });
    return summary;
  });

  const suggested = [...voteSummary].sort((a, b) => b.best - a.best)[0];

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-1">Suggested Evening Out Date</h1>
      {poll.title && (
        <p className="text-base text-gray-700 italic">Event: {poll.title}</p>
      )}
      {poll.location && (
        <p className="text-base text-gray-500 mb-4">📍 Location: {poll.location}</p>
      )}

      {(timerExpired || reveal) ? (
        <div className="bg-green-100 border border-green-300 p-4 rounded mb-6">
          <strong>🎯 Suggested Date:</strong>
          <div className="text-lg mt-1">
            {format(parseISO(suggested.date), 'EEEE do MMMM yyyy')}
            <span className="ml-2 text-sm text-gray-600">({suggested.best} Best votes)</span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setReveal(true)}
          className="bg-yellow-100 border border-yellow-300 p-4 rounded mb-6 cursor-pointer hover:bg-yellow-200 transition"
        >
          <strong>🎯 Suggested Date:</strong>
          <div className="mt-1 text-gray-700">
            Waiting for all votes to come in...<br />
            <span className="italic">Tap to reveal if you want to see now!</span>
          </div>
        </div>
      )}

      {voteSummary.map((summary) => (
        <div key={summary.date} className="border p-3 rounded mb-3">
          <div className="font-semibold mb-1">
            {format(parseISO(summary.date), 'EEEE do MMMM yyyy')}
          </div>
          <div className="text-sm flex gap-6">
            ✅ Best: {summary.best}
            🤔 Maybe: {summary.maybe}
            ❌ No: {summary.no}
          </div>
        </div>
      ))}

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-2">Who voted:</h2>
      <ul className="space-y-1">
        {votes.map((v) => (
          <li key={v.id}>
            <strong>{v.name}</strong> at{" "}
            {v.createdAt?.toDate().toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
