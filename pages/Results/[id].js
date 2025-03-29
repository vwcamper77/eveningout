// ✅ pages/results/[id].js — now includes “Create Your Own Event” link safely

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { format, parseISO } from "date-fns";

export default function ResultsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [poll, setPoll] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const pollRef = doc(db, "polls", id);
      const pollSnap = await getDoc(pollRef);

      if (!pollSnap.exists()) {
        setLoading(false);
        return;
      }

      const pollData = pollSnap.data();

      const votesRef = collection(db, "polls", id, "votes");
      const votesSnap = await getDocs(votesRef);
      const allVotes = votesSnap.docs.map((doc) => doc.data());

      setPoll(pollData);
      setVotes(allVotes);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!poll?.createdAt?.toDate) return;

    const createdAt = poll.createdAt.toDate();
    const deadline = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);

    const updateCountdown = () => {
      const now = new Date();
      const diff = deadline - now;

      if (diff <= 0) {
        setRevealed(true);
        setTimeLeft("Voting has closed");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s left to vote`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [poll]);

  if (loading) return <p className="p-4">Loading results...</p>;
  if (!poll) return <p className="p-4">Poll not found.</p>;

  const voteSummary = poll.dates.map((date) => {
    const yesNames = [], maybeNames = [], noNames = [];

    votes.forEach((v) => {
      const val = v.votes[date];
      if (val === "yes") yesNames.push(v.name);
      else if (val === "maybe") maybeNames.push(v.name);
      else if (val === "no") noNames.push(v.name);
    });

    return {
      date,
      yes: yesNames.length,
      maybe: maybeNames.length,
      no: noNames.length,
      yesNames,
      maybeNames,
      noNames,
    };
  });

  const sorted = [...voteSummary].sort((a, b) => b.yes - a.yes);
  const suggested = sorted[0];
  const pollUrl = typeof window !== "undefined" ? window.location.origin + `/poll/${id}` : "";

  const share = (platform) => {
    const message = `Hey you are invited for an ${poll.title} evening out in ${poll.location}! Vote on what day suits you now! ${pollUrl}`;
    navigator.clipboard.writeText(pollUrl);
    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      window.open(pollUrl, "_blank");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Suggested Evening Out Date</h1>
      <p className="text-sm text-gray-600 mb-1">Location: {poll.location}</p>

      {timeLeft && (
        <p className="text-xs text-blue-600 font-medium mb-4">⏳ {timeLeft}</p>
      )}

      {suggested && (
        <div className="relative mb-6">
          <div
            className={`bg-green-100 border border-green-300 p-4 rounded transition-all duration-500 ease-in-out transform ${
              revealed ? "scale-100 blur-0" : "scale-95 blur-sm"
            }`}
          >
            <strong>🎯 Suggested evening out date:</strong>
            <div className="text-lg mt-1">
              {format(parseISO(suggested.date), "EEEE do MMMM yyyy")} {" "}
              <span className="ml-2 text-sm text-gray-600">
                ({suggested.yes} can attend)
              </span>
            </div>
          </div>
          {!revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="absolute inset-0 flex flex-col items-center justify-center text-blue-600 font-semibold text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
            >
              <span>Currently receiving votes!</span>
              <span>(Tap to reveal the current best evening out 😉)</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {voteSummary.map((res) => (
          <div key={res.date} className="border p-4 rounded shadow-sm bg-white">
            <div className="font-semibold mb-2">
              {format(parseISO(res.date), "EEEE do MMMM yyyy")}
            </div>
            <div className="grid grid-cols-3 text-center text-sm font-medium border-b pb-1">
              <div className="text-green-700">✅ Can Attend: {res.yes}</div>
              <div className="text-yellow-700">🤔 Maybe: {res.maybe}</div>
              <div className="text-red-700">❌ No: {res.no}</div>
            </div>
            <div className="grid grid-cols-3 text-center text-xs mt-2 text-gray-600">
              <div>{res.yesNames.length ? res.yesNames.join(", ") : "-"}</div>
              <div>{res.maybeNames.length ? res.maybeNames.join(", ") : "-"}</div>
              <div>{res.noNames.length ? res.noNames.join(", ") : "-"}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-xl font-semibold mb-3">Share Event with Friends</h2>
        <div className="flex justify-center gap-4 items-center">
          <button onClick={() => share("whatsapp")} title="Share on WhatsApp">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp" className="w-8 h-8" />
          </button>
          <button onClick={() => share("discord")} title="Share on Discord">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111370.png" alt="Discord" className="w-8 h-8" />
          </button>
          <button onClick={() => share("slack")} title="Share on Slack">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111615.png" alt="Slack" className="w-8 h-8" />
          </button>
          <button onClick={() => share("copy")} title="Copy Link">
            <img src="https://cdn-icons-png.flaticon.com/512/1388/1388978.png" alt="Copy Link" className="w-8 h-8" />
          </button>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center text-blue-600 font-semibold hover:underline"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/747/747310.png"
              alt="Calendar"
              className="w-5 h-5 mr-2"
            />
            Create Your Own Event
          </a>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Who Voted</h2>
        <ul className="space-y-1 text-sm">
          {votes.map((v, i) => (
            <li key={i}>
              <strong>{v.name}</strong> at {v.createdAt?.seconds ? new Date(v.createdAt.seconds * 1000).toLocaleString() : "unknown time"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}