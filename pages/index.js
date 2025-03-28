import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Home() {
  const [hostName, setHostName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [location, setLocation] = useState("");
  const [dates, setDates] = useState([""]);
  const router = useRouter();

  const handleDateChange = (index, value) => {
    const newDates = [...dates];
    newDates[index] = value;
    setDates(newDates);
  };

  const addDateField = () => {
    setDates([...dates, ""]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const docRef = await addDoc(collection(db, "polls"), {
      hostName,
      eventTitle,
      location,
      dates,
      createdAt: serverTimestamp(),
    });
    router.push(`/poll/${docRef.id}`);
  };

  return (
    <div className="min-h-screen p-6 bg-white text-black max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create a Drinks Poll 🍻</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Your name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Event title"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <div>
          <label className="block font-medium mb-2">Add dates:</label>
          {dates.map((date, index) => (
            <input
              key={index}
              className="w-full border p-2 rounded mb-2"
              type="date"
              value={date}
              onChange={(e) => handleDateChange(index, e.target.value)}
              required
            />
          ))}
          <button
            type="button"
            onClick={addDateField}
            className="text-blue-600 mt-2"
          >
            + Add another date
          </button>
        </div>
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded w-full"
        >
          Create Poll
        </button>
      </form>
    </div>
  );
}
