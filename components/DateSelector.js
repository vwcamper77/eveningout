import { format, isFriday } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export default function DateSelector({ selectedDates, setSelectedDates }) {
  return (
    <div className="flex flex-col items-center mt-4">
      <DayPicker
        mode="multiple"
        selected={selectedDates}
        onSelect={(dates) => setSelectedDates(dates || [])}
        modifiers={{
          friday: (date) => isFriday(date),
        }}
        modifiersClassNames={{
          friday: 'text-blue-600 font-bold',
        }}
        className="mx-auto"
      />

      <div className="mt-6 text-center w-full">
        <strong className="block mb-2">Selected dates:</strong>
        <ul className="space-y-1">
          {selectedDates.map((date, i) => (
            <li key={i}>
              {format(date, 'EEEE do MMMM yyyy')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
