using Verdelak.Api.Dtos;

namespace Verdelak.Api.Services;

public class GuitarTheoryService : IGuitarTheoryService
{
    private static readonly string[] ChromaticSharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    private static readonly Dictionary<string, int> NoteIndexes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["C"] = 0, ["B#"] = 0,
        ["C#"] = 1, ["Db"] = 1,
        ["D"] = 2,
        ["D#"] = 3, ["Eb"] = 3,
        ["E"] = 4, ["Fb"] = 4,
        ["F"] = 5, ["E#"] = 5,
        ["F#"] = 6, ["Gb"] = 6,
        ["G"] = 7,
        ["G#"] = 8, ["Ab"] = 8,
        ["A"] = 9,
        ["A#"] = 10, ["Bb"] = 10,
        ["B"] = 11, ["Cb"] = 11
    };

    private static readonly IReadOnlyList<ScaleDefinitionDto> Scales =
    [
        new("Major", [0, 2, 4, 5, 7, 9, 11], ["1", "2", "3", "4", "5", "6", "7"], "Major", "Bright parent major scale."),
        new("Natural Minor", [0, 2, 3, 5, 7, 8, 10], ["1", "2", "b3", "4", "5", "b6", "b7"], "Minor", "Aeolian minor scale."),
        new("Minor", [0, 2, 3, 5, 7, 8, 10], ["1", "2", "b3", "4", "5", "b6", "b7"], "Minor", "Alias for Natural Minor."),
        new("Harmonic Minor", [0, 2, 3, 5, 7, 8, 11], ["1", "2", "b3", "4", "5", "b6", "7"], "Minor", "Minor scale with a raised seventh."),
        new("Melodic Minor", [0, 2, 3, 5, 7, 9, 11], ["1", "2", "b3", "4", "5", "6", "7"], "Minor", "Jazz melodic minor ascending form."),
        new("Double Harmonic", [0, 1, 4, 5, 7, 8, 11], ["1", "b2", "3", "4", "5", "b6", "7"], "Exotic", "Major scale with b2 and b6."),
        new("Hungarian Minor", [0, 2, 3, 6, 7, 8, 11], ["1", "2", "b3", "#4", "5", "b6", "7"], "Exotic", "Minor scale with raised fourth and seventh."),
        new("Phrygian Dominant", [0, 1, 4, 5, 7, 8, 10], ["1", "b2", "3", "4", "5", "b6", "b7"], "Exotic", "Fifth mode of harmonic minor."),
        new("Dorian", [0, 2, 3, 5, 7, 9, 10], ["1", "2", "b3", "4", "5", "6", "b7"], "Mode", "Minor mode with a natural sixth."),
        new("Mixolydian", [0, 2, 4, 5, 7, 9, 10], ["1", "2", "3", "4", "5", "6", "b7"], "Mode", "Major dominant mode."),
        new("Major Pentatonic", [0, 2, 4, 7, 9], ["1", "2", "3", "5", "6"], "Pentatonic", "Five-note major scale."),
        new("Minor Pentatonic", [0, 3, 5, 7, 10], ["1", "b3", "4", "5", "b7"], "Pentatonic", "Five-note minor scale."),
        new("Blues", [0, 3, 5, 6, 7, 10], ["1", "b3", "4", "b5", "5", "b7"], "Blues", "Minor pentatonic with the blue note.")
    ];

    private static readonly IReadOnlyList<TuningDefinitionDto> Tunings =
    [
        new("Guitar Standard", "Guitar", 6, ["E", "A", "D", "G", "B", "E"], "E standard, low to high."),
        new("Guitar Eb Standard", "Guitar", 6, ["Eb", "Ab", "Db", "Gb", "Bb", "Eb"], "Half-step-down standard."),
        new("Guitar Drop D", "Guitar", 6, ["D", "A", "D", "G", "B", "E"], "Drop D, low to high."),
        new("Guitar D Standard", "Guitar", 6, ["D", "G", "C", "F", "A", "D"], "Whole-step-down standard."),
        new("Guitar Drop C", "Guitar", 6, ["C", "G", "C", "F", "A", "D"], "Drop C, low to high."),
        new("Guitar DADGAD", "Guitar", 6, ["D", "A", "D", "G", "A", "D"], "Modal DADGAD tuning."),
        new("Guitar Open D", "Guitar", 6, ["D", "A", "D", "F#", "A", "D"], "Open D major tuning."),
        new("Guitar Open E", "Guitar", 6, ["E", "B", "E", "G#", "B", "E"], "Open E major tuning."),
        new("Guitar Open G", "Guitar", 6, ["D", "G", "D", "G", "B", "D"], "Open G tuning."),
        new("Baritone B Standard", "Guitar", 6, ["B", "E", "A", "D", "F#", "B"], "Baritone B standard, low to high."),
        new("Bass Standard", "Bass", 4, ["E", "A", "D", "G"], "Four-string bass standard."),
        new("Bass Drop D", "Bass", 4, ["D", "A", "D", "G"], "Four-string bass drop D."),
        new("Bass BEAD", "Bass", 4, ["B", "E", "A", "D"], "Four-string bass with low B extension."),
        new("Bass Tenor", "Bass", 4, ["A", "D", "G", "C"], "Four-string tenor bass tuning."),
        new("Bass 5 Standard", "Bass", 5, ["B", "E", "A", "D", "G"], "Five-string bass standard."),
        new("Bass 5 Drop A", "Bass", 5, ["A", "E", "A", "D", "G"], "Five-string bass drop A."),
        new("Bass 6 Standard", "Bass", 6, ["B", "E", "A", "D", "G", "C"], "Six-string bass standard."),
        new("7-String Standard", "Guitar", 7, ["B", "E", "A", "D", "G", "B", "E"], "Seven-string guitar standard."),
        new("7-String Drop A", "Guitar", 7, ["A", "E", "A", "D", "G", "B", "E"], "Seven-string guitar drop A."),
        new("8-String Standard", "Guitar", 8, ["F#", "B", "E", "A", "D", "G", "B", "E"], "Eight-string guitar standard."),
        new("8-String Drop E", "Guitar", 8, ["E", "B", "E", "A", "D", "G", "B", "E"], "Eight-string guitar drop E."),
        new("9-String Standard", "Guitar", 9, ["C#", "F#", "B", "E", "A", "D", "G", "B", "E"], "Nine-string guitar standard.")
    ];

    public GuitarExplorerOptionsDto GetOptions() => new(
        ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        Scales,
        Tunings,
        ["notes", "intervals"]);

    public GuitarExplorerResultDto Generate(GuitarExplorerRequestDto request)
    {
        var rootIndex = NoteIndex(request.RootNote);
        var scale = Scales.FirstOrDefault(scale => scale.Name.Equals(request.ScaleType, StringComparison.OrdinalIgnoreCase))
            ?? Scales[0];
        var stringCount = Math.Clamp(request.StringCount, 4, 9);
        var fretCount = Math.Clamp(request.FretCount, 5, 36);
        var displayMode = request.DisplayMode.Equals("intervals", StringComparison.OrdinalIgnoreCase) ? "intervals" : "notes";
        var tuning = ResolveTuning(request, stringCount);
        var scaleNoteIndexes = scale.Intervals.Select(interval => (rootIndex + interval) % 12).ToList();
        var scaleNotes = scaleNoteIndexes.Select(index => ChromaticSharp[index]).ToList();
        var fretboard = BuildFretboard(tuning.Notes, fretCount, rootIndex, scale, scaleNoteIndexes, displayMode);
        var positions = BuildPositions(fretboard, fretCount);
        var chords = BuildChords(scale, scaleNotes, scaleNoteIndexes);
        var arpeggios = BuildArpeggios(chords, scale);

        return new GuitarExplorerResultDto(
            ChromaticSharp[rootIndex],
            scale,
            tuning,
            scaleNotes,
            fretboard,
            positions,
            chords,
            arpeggios,
            BuildPracticeRoutine(scale.Name, tuning.Name, positions),
            BuildProgressions(scale.Family, chords));
    }

    private static TuningDefinitionDto ResolveTuning(GuitarExplorerRequestDto request, int stringCount)
    {
        if (request.CustomTuning is { Count: > 0 })
        {
            var notes = request.CustomTuning
                .Where(note => !string.IsNullOrWhiteSpace(note))
                .Select(note => ChromaticSharp[NoteIndex(note)])
                .Take(9)
                .ToList();
            if (notes.Count >= 4)
            {
                return new TuningDefinitionDto("Custom", "Custom", notes.Count, notes, "Custom tuning, low to high.");
            }
        }

        var named = Tunings.FirstOrDefault(tuning =>
            tuning.Name.Equals(request.TuningName ?? string.Empty, StringComparison.OrdinalIgnoreCase) &&
            tuning.StringCount == stringCount);
        return named
            ?? Tunings.FirstOrDefault(tuning => tuning.StringCount == stringCount)
            ?? Tunings.First(tuning => tuning.Name == "Guitar Standard");
    }

    private static IReadOnlyList<FretboardStringDto> BuildFretboard(
        IReadOnlyList<string> tuning,
        int fretCount,
        int rootIndex,
        ScaleDefinitionDto scale,
        IReadOnlyList<int> scaleNoteIndexes,
        string displayMode)
    {
        return tuning.Select((openNote, stringIndex) =>
        {
            var openIndex = NoteIndex(openNote);
            var frets = Enumerable.Range(0, fretCount + 1)
                .Select(fret =>
                {
                    var noteIndex = (openIndex + fret) % 12;
                    var scaleDegreeIndex = IndexOf(scaleNoteIndexes, noteIndex);
                    var isScaleNote = scaleDegreeIndex >= 0;
                    var isRoot = noteIndex == rootIndex;
                    var note = ChromaticSharp[noteIndex];
                    var interval = isScaleNote ? scale.Formula[scaleDegreeIndex] : string.Empty;
                    return new FretboardNoteDto(
                        fret,
                        note,
                        interval,
                        isScaleNote,
                        isRoot,
                        displayMode == "intervals" ? interval : note);
                })
                .ToList();
            return new FretboardStringDto(tuning.Count - stringIndex, ChromaticSharp[openIndex], frets);
        }).ToList();
    }

    private static IReadOnlyList<FretboardPositionDto> BuildPositions(IReadOnlyList<FretboardStringDto> fretboard, int fretCount)
    {
        var starts = new[] { 0, 2, 5, 7, 10, 12, 15 }
            .Where(start => start <= Math.Max(0, fretCount - 3))
            .Distinct()
            .Take(5)
            .ToList();
        if (starts.Count == 0)
        {
            starts.Add(0);
        }

        return starts.Select((start, index) =>
        {
            var end = Math.Min(fretCount, start + 4);
            var strings = fretboard
                .Select(item => item with
                {
                    Frets = item.Frets.Where(fret => fret.Fret >= start && fret.Fret <= end).ToList()
                })
                .ToList();
            return new FretboardPositionDto(index + 1, start, end, strings);
        }).ToList();
    }

    private static IReadOnlyList<HarmonizedChordDto> BuildChords(
        ScaleDefinitionDto scale,
        IReadOnlyList<string> scaleNotes,
        IReadOnlyList<int> scaleNoteIndexes)
    {
        var degreeLabels = new[] { "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX" };
        return scaleNotes.Select((note, degreeIndex) =>
        {
            var triadIndexes = new[] { degreeIndex, degreeIndex + 2, degreeIndex + 4 }
                .Select(index => scaleNoteIndexes[index % scaleNoteIndexes.Count])
                .ToList();
            var seventhIndexes = new[] { degreeIndex, degreeIndex + 2, degreeIndex + 4, degreeIndex + 6 }
                .Select(index => scaleNoteIndexes[index % scaleNoteIndexes.Count])
                .ToList();
            var triadNotes = triadIndexes.Select(index => ChromaticSharp[index]).ToList();
            var seventhNotes = seventhIndexes.Select(index => ChromaticSharp[index]).ToList();
            var triadQuality = TriadQuality(triadIndexes);
            var seventhQuality = scaleNoteIndexes.Count >= 7 ? SeventhQuality(seventhIndexes) : null;
            return new HarmonizedChordDto(
                degreeLabels[degreeIndex],
                note,
                $"{note}{triadQuality}",
                triadNotes,
                seventhQuality is null ? null : $"{note}{seventhQuality}",
                seventhNotes);
        }).ToList();
    }

    private static string TriadQuality(IReadOnlyList<int> notes)
    {
        var third = Distance(notes[0], notes[1]);
        var fifth = Distance(notes[0], notes[2]);
        return (third, fifth) switch
        {
            (4, 7) => "",
            (3, 7) => "m",
            (3, 6) => "dim",
            (4, 8) => "aug",
            (5, 7) => "sus4",
            (2, 7) => "sus2",
            _ => $"({third}/{fifth})"
        };
    }

    private static string SeventhQuality(IReadOnlyList<int> notes)
    {
        var triad = TriadQuality(notes);
        var seventh = Distance(notes[0], notes[3]);
        return (triad, seventh) switch
        {
            ("", 11) => "maj7",
            ("", 10) => "7",
            ("m", 10) => "m7",
            ("m", 11) => "mMaj7",
            ("dim", 10) => "m7b5",
            ("dim", 9) => "dim7",
            ("aug", 11) => "augMaj7",
            ("aug", 10) => "aug7",
            _ => $"{triad} add{seventh}"
        };
    }

    private static IReadOnlyList<ArpeggioPatternDto> BuildArpeggios(
        IReadOnlyList<HarmonizedChordDto> chords,
        ScaleDefinitionDto scale)
    {
        var triadIntervals = new[] { "1", "3", "5" };
        var seventhIntervals = new[] { "1", "3", "5", "7" };

        return chords.Take(7).SelectMany((chord, index) =>
        {
            var formula = scale.Formula;
            var triadFormula = new[] { formula[index % formula.Count], formula[(index + 2) % formula.Count], formula[(index + 4) % formula.Count] };
            var seventhFormula = new[] { formula[index % formula.Count], formula[(index + 2) % formula.Count], formula[(index + 4) % formula.Count], formula[(index + 6) % formula.Count] };

            var patterns = new List<ArpeggioPatternDto>
            {
                new(
                    chord.Degree,
                    chord.Triad,
                    "Triad",
                    chord.TriadNotes,
                    triadFormula.Zip(triadIntervals, (actual, role) => $"{role} ({actual})").ToList(),
                    $"Target {chord.Triad} tones ascending, then descend 5-3-1 before moving to the next degree.")
            };

            if (!string.IsNullOrWhiteSpace(chord.Seventh))
            {
                patterns.Add(new(
                    chord.Degree,
                    chord.Seventh,
                    "Seventh",
                    chord.SeventhNotes,
                    seventhFormula.Zip(seventhIntervals, (actual, role) => $"{role} ({actual})").ToList(),
                    $"Use {chord.Seventh} as a four-note sweep or string-skip pattern, resolving back to {chord.RootNote}."));
            }

            return patterns;
        }).ToList();
    }

    private static IReadOnlyList<string> BuildProgressions(string family, IReadOnlyList<HarmonizedChordDto> chords)
    {
        var named = chords.Take(7).Select(chord => chord.Triad).ToList();
        if (named.Count < 7)
        {
            return ["Use drone-root vamps and two-chord loops while learning the color notes."];
        }

        return family switch
        {
            "Major" => [$"{named[0]} - {named[3]} - {named[4]}", $"{named[1]} - {named[4]} - {named[0]}", $"{named[0]} - {named[5]} - {named[3]} - {named[4]}"],
            "Minor" => [$"{named[0]} - {named[3]} - {named[4]}", $"{named[0]} - {named[5]} - {named[6]}", $"{named[1]} - {named[4]} - {named[0]}"],
            "Mode" => [$"{named[0]} - {named[6]}", $"{named[0]} - {named[3]}", $"{named[0]} drone with {named[1]} and {named[6]} color tones"],
            "Pentatonic" => [$"{named[0]} vamp", $"{named[0]} - {named[2]}", $"{named[0]} - {named[3]} call and response"],
            "Blues" => [$"{named[0]}7 vamp", $"{named[0]} - {named[3]} - {named[4]} blues movement", $"{named[0]} minor/major blend over dominant chords"],
            _ => [$"{named[0]} drone", $"{named[0]} - {named[1]}", $"{named[0]} - {named[4]} with scale color tones"]
        };
    }

    private static IReadOnlyList<PracticeRoutineDto> BuildPracticeRoutine(
        string scaleName,
        string tuningName,
        IReadOnlyList<FretboardPositionDto> positions) =>
    [
        new("Map the scale", "Ascending and descending scale practice", [
            $"Play {scaleName} from the lowest available root to the highest available root in {tuningName}.",
            "Say each note or interval out loud.",
            "Descend using alternate picking or strict finger alternation."
        ]),
        new("Four-note sequences", "1234 / 2345 sequencing", [
            "Play scale degrees 1-2-3-4, then 2-3-4-5, then continue through the position.",
            "Reverse the sequence descending: 7-6-5-4, 6-5-4-3, and so on.",
            "Move the same sequence to the next position."
        ]),
        new("Position shifts", "Controlled movement across the neck", [
            $"Start in position {positions.First().StartFret}-{positions.First().EndFret}.",
            "Shift to the next position on a shared note instead of jumping blindly.",
            "Repeat with a metronome and increase tempo only after clean shifts."
        ]),
        new("String skipping", "Wider interval awareness", [
            "Play one scale note on a string, skip the next string, then play the next available scale note.",
            "Reverse direction after each string pair.",
            "Target root notes as landing points."
        ]),
        new("Improvisation prompt", "Musical application", [
            "Loop a matching chord or drone.",
            "Improvise using only three notes for one minute.",
            "Add one color interval at a time and listen for how it changes the mood."
        ])
    ];

    private static int NoteIndex(string note)
    {
        if (NoteIndexes.TryGetValue(note.Trim(), out var index))
        {
            return index;
        }

        throw new ArgumentException($"Unknown note '{note}'.");
    }

    private static int Distance(int root, int target) => (target - root + 12) % 12;

    private static int IndexOf(IReadOnlyList<int> values, int value)
    {
        for (var i = 0; i < values.Count; i++)
        {
            if (values[i] == value)
            {
                return i;
            }
        }

        return -1;
    }
}
