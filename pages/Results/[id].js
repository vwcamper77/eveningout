import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import WhatsAppShareButton from "@/components/WhatsAppShareButton";

export default function ResultsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [poll, setPoll] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchPoll = async () => {
        const docRef = doc(db, "polls", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPoll(data);
          handleCountdown(data.createdAt?.seconds);
        }
      };
      fetchPoll();
    }
  }, [id]);

  const handleCountdown = (createdAtSeconds) => {
    const endTime = new Date((createdAtSeconds + 2 * 24 * 60 * 60) * 1000); // 2 days later
    const interval = setInterval(() => {
      const now = new Date();
      const distance = endTime - now;

      if (distance <= 0) {
        clearInterval(interval);
        setShowResult(true);
        setTimeLeft(null);
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
  };

  const findSuggestedDate = () => {
    if (!poll || !poll.votes) return null;

    const tally = {};
    poll.votes.forEach((vote) => {
      Object.entries(vote.dates || {}).forEach(([date, response]) => {
        if (response === "yes") {
          tally[date] = (tally[date] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  };

  const suggestedDate = findSuggestedDate();

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-center">Suggested Evening Out Date</h1>

      {poll?.location && (
        <p className="text-center text-sm text-gray-600 mb-4">📍 {poll.location}</p>
      )}

      {!showResult && timeLeft && (
        <div className="text-center mb-4">
          <p className="text-gray-700 text-sm">⏳ Poll is still live</p>
          <p className="font-semibold">{timeLeft} remaining</p>
          <button
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => setShowResult(true)}
          >
            Tap to reveal early
          </button>
        </div>
      )}

      {showResult && suggestedDate && (
        <div className="text-center bg-green-100 border border-green-300 p-4 rounded mt-4">
          <p className="text-sm text-gray-600 mb-1">Best date based on responses:</p>
          <p className="text-xl font-semibold text-green-800">
            {format(parseISO(suggestedDate), "EEEE do MMMM yyyy")}
          </p>
        </div>
      )}

      <WhatsAppShareButton
        url={typeof window !== "undefined" ? window.location.href : ""}
        message="Check out the results for our drinks night!"
      />
    </div>
  );
}
