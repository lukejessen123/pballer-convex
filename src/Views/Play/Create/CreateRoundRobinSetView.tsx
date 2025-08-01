import React, { useState } from 'react';

// We can create a shared component for this later
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-800 p-6 rounded-lg mb-6">
    <h2 className="text-xl font-semibold text-teal-400 mb-4">{title}</h2>
    {children}
  </div>
);

interface CreateRoundRobinSetViewProps {
  onNavigate?: (path: string) => void;
  onCreateEvent?: (eventData: any) => Promise<void>;
  currentUserId?: string;
  profileId?: string;
}

const CreateRoundRobinSetView: React.FC<CreateRoundRobinSetViewProps> = ({ 
  onNavigate, 
  onCreateEvent, 
  currentUserId, 
  profileId 
}) => {
  // Default event name to the format title
  const defaultEventName = 'Round Robin: Set Partners';
  const [eventName, setEventName] = useState(defaultEventName);
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState('');
  const [maxTeams, setMaxTeams] = useState(8);
  const [gender, setGender] = useState('mixed');
  const [numberOfCourts, setNumberOfCourts] = useState(2);
  const [courtNames, setCourtNames] = useState<Record<number, string>>({});
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  
  // DUPR related state
  const [requireDupr, setRequireDupr] = useState(false);
  const [minDupr, setMinDupr] = useState('');
  const [maxDupr, setMaxDupr] = useState('');
  const [submitToDupr, setSubmitToDupr] = useState(false);
  const [duprClubId, setDuprClubId] = useState('');

  // Scoring options
  const [gamesPerMatch, setGamesPerMatch] = useState(1);
  const [pointsToWin, setPointsToWin] = useState(11);
  const [winByMargin, setWinByMargin] = useState(2);

  const [isLoading, setIsLoading] = useState(false);

  const handleCourtNameChange = (courtNumber: number, name: string) => {
    setCourtNames(prev => ({...prev, [courtNumber]: name}));
  };

  // Debounce timer for location search
  let locationTimeout: NodeJS.Timeout;
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocation(query);
    clearTimeout(locationTimeout);

    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsLocationLoading(true);
    locationTimeout = setTimeout(() => {
      try {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
          .then(res => res.json())
          .then(data => {
            setLocationSuggestions(data);
            setIsLocationLoading(false);
          }).catch(err => {
            console.error("Location fetch failed:", err);
            setIsLocationLoading(false);
          });
      } catch (error) {
        console.error("Error in location fetch logic:", error);
        setIsLocationLoading(false);
      }
    }, 500); // 500ms debounce
  };

  const handleSelectLocation = (suggestion: any) => {
    setLocation(suggestion.display_name);
    setLocationSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !profileId) {
      // Handle not logged in case
      return;
    }
    setIsLoading(true);

    // TODO: Form validation
    if (!eventName || !location || !eventDate || !startTime || !endTime) {
      // Handle validation error
      setIsLoading(false);
      return;
    }

    try {
      const eventData = {
        name: eventName,
        location,
        start_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        description,
        access_mode: isPrivate ? 'private' : 'public',
        total_players: maxTeams * 2,
        dupr_min: requireDupr ? parseFloat(minDupr) : null,
        dupr_max: requireDupr ? parseFloat(maxDupr) : null,
        gender_type: gender,
        games_per_match: gamesPerMatch,
        points_to_win: pointsToWin,
        win_by_margin: winByMargin,
        courts: numberOfCourts,
        // Storing court names directly on the event for simplicity
        court_meta: courtNames,
        created_by: profileId,
        event_type: 'round_robin_set'
      };

      if (onCreateEvent) {
        await onCreateEvent(eventData);
      }

    } catch (error: any) {
      console.error("Error creating event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <button onClick={() => onNavigate?.('/play')} className="text-gray-400 hover:text-white mb-4">
        &larr; Back to Game Formats
      </button>
      <h1 className="text-3xl font-bold text-white mb-2">Create Round Robin (Set Partners)</h1>
      <p className="text-gray-400 mb-8">Play with the same partner for every round. You score as a team.</p>

      <form onSubmit={handleSubmit}>
        <FormSection title="Event Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Event Title" value={eventName} onChange={e => setEventName(e.target.value)} className="input-field" required />
            <div className="relative">
              <input 
                type="text" 
                placeholder="Location" 
                value={location} 
                onChange={handleLocationChange} 
                className="input-field" 
                required 
              />
              {isLocationLoading && <div className="absolute right-2 top-2"><div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div></div>}
              {locationSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto">
                  {locationSuggestions.map((item) => (
                    <li 
                      key={item.place_id} 
                      onClick={() => handleSelectLocation(item)}
                      className="px-4 py-2 text-white hover:bg-teal-600 cursor-pointer"
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="input-field with-icon" required />
            <div className="flex gap-2">
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-field with-icon w-1/2" required />
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-field with-icon w-1/2" required />
            </div>
          </div>
          <textarea placeholder="Game Description (Optional)" value={description} onChange={e => setDescription(e.target.value)} className="input-field mt-4 w-full" rows={3}></textarea>
        </FormSection>

        <FormSection title="Court Setup">
          <div>
            <label htmlFor="numCourts" className="block text-gray-300 mb-2">Number of Courts</label>
            <input 
              type="number" 
              id="numCourts" 
              value={numberOfCourts} 
              onChange={e => setNumberOfCourts(parseInt(e.target.value))} 
              className="input-field w-24"
              min="1"
              max="20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {Array.from({ length: numberOfCourts }, (_, i) => i + 1).map(courtNum => (
              <div key={courtNum}>
                <label htmlFor={`courtName-${courtNum}`} className="block text-gray-400 text-sm mb-1">Court {courtNum} Name</label>
                <input
                  type="text"
                  id={`courtName-${courtNum}`}
                  placeholder={`Court ${courtNum}`}
                  value={courtNames[courtNum] || ''}
                  onChange={(e) => handleCourtNameChange(courtNum, e.target.value)}
                  className="input-field"
                />
              </div>
            ))}
          </div>
        </FormSection>

        <FormSection title="Game Rules">
          {/* Public vs Private Toggle */}
          <div className="mb-4">
             <label className="block text-gray-300 mb-2">Is this game public or private?</label>
             <div className="flex gap-2">
                <button type="button" onClick={() => setIsPrivate(true)} className={`btn ${isPrivate ? 'btn-primary' : 'btn-secondary'}`}>Private</button>
                <button type="button" onClick={() => setIsPrivate(false)} className={`btn ${!isPrivate ? 'btn-primary' : 'btn-secondary'}`}>Public</button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxTeams" className="block text-gray-300 mb-2">Max # of Teams</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMaxTeams(p => Math.max(2, p - 1))} className="btn btn-secondary px-4">-</button>
                <span className="text-white text-lg font-semibold w-12 text-center">{maxTeams}</span>
                <button type="button" onClick={() => setMaxTeams(p => Math.min(32, p + 1))} className="btn btn-secondary px-4">+</button>
              </div>
            </div>
            <div>
              <label htmlFor="gender" className="block text-gray-300 mb-2">Gender</label>
              <select id="gender" value={gender} onChange={e => setGender(e.target.value)} className="input-field w-full">
                <option value="mixed">Mixed</option>
                <option value="mens">Men's</option>
                <option value="womens">Women's</option>
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Scoring">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-gray-300 mb-2">Matches will be:</label>
               <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-white"><input type="radio" name="scoring" checked={gamesPerMatch === 1} onChange={() => setGamesPerMatch(1)} /> 1 Game</label>
                  <label className="flex items-center gap-2 text-white"><input type="radio" name="scoring" checked={gamesPerMatch === 2} onChange={() => setGamesPerMatch(2)} /> Best 2/3</label>
               </div>
            </div>
             <div>
                <label htmlFor="pointsToWin" className="block text-gray-300 mb-2">Game to</label>
                <input type="number" id="pointsToWin" value={pointsToWin} onChange={e => setPointsToWin(parseInt(e.target.value))} className="input-field" />
             </div>
             <div>
                <label htmlFor="winByMargin" className="block text-gray-300 mb-2">Win by</label>
                <input type="number" id="winByMargin" value={winByMargin} onChange={e => setWinByMargin(parseInt(e.target.value))} className="input-field" />
             </div>
          </div>
        </FormSection>

        <FormSection title="DUPR Integration (Optional)">
          {/* DUPR Fields Here */}
          <p className="text-gray-500">DUPR fields coming soon...</p>
        </FormSection>

        <div className="mt-8 text-center">
          <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Game & Proceed to Invites'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Basic styling for form elements to be reused
const styles = `
  .input-field {
    background-color: #1F2937;
    color: white;
    border: 1px solid #4B5563;
    border-radius: 0.375rem;
    padding: 0.75rem 1rem;
    width: 100%;
  }
  .input-field.with-icon {
    color-scheme: dark;
  }
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 600;
    transition: background-color 0.2s;
  }
  .btn-primary {
    background-color: #0F766E;
    color: white;
  }
  .btn-primary:hover {
    background-color: #115e58;
  }
  .btn-secondary {
    background-color: #4B5563;
    color: white;
  }
  .btn-secondary:hover {
    background-color: #6B7280;
  }
  .btn-lg {
    font-size: 1.125rem;
  }
`;

// Inject styles into the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default CreateRoundRobinSetView; 