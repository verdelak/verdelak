namespace Verdelak.Api.Dtos;

public record GuitarExplorerRequestDto(
    string RootNote,
    string ScaleType,
    string? TuningName,
    IReadOnlyList<string>? CustomTuning,
    int StringCount,
    int FretCount,
    string DisplayMode);

public record GuitarExplorerOptionsDto(
    IReadOnlyList<string> RootNotes,
    IReadOnlyList<ScaleDefinitionDto> Scales,
    IReadOnlyList<TuningDefinitionDto> Tunings,
    IReadOnlyList<string> DisplayModes);

public record ScaleDefinitionDto(
    string Name,
    IReadOnlyList<int> Intervals,
    IReadOnlyList<string> Formula,
    string Family,
    string Description);

public record TuningDefinitionDto(
    string Name,
    string Instrument,
    int StringCount,
    IReadOnlyList<string> Notes,
    string Description);

public record GuitarExplorerResultDto(
    string RootNote,
    ScaleDefinitionDto Scale,
    TuningDefinitionDto Tuning,
    IReadOnlyList<string> ScaleNotes,
    IReadOnlyList<FretboardStringDto> Fretboard,
    IReadOnlyList<FretboardPositionDto> Positions,
    IReadOnlyList<HarmonizedChordDto> Chords,
    IReadOnlyList<ArpeggioPatternDto> Arpeggios,
    IReadOnlyList<PracticeRoutineDto> PracticeRoutine,
    IReadOnlyList<string> SuggestedProgressions);

public record FretboardStringDto(
    int StringNumber,
    string OpenNote,
    IReadOnlyList<FretboardNoteDto> Frets);

public record FretboardNoteDto(
    int Fret,
    string Note,
    string Interval,
    bool IsScaleNote,
    bool IsRoot,
    string Display);

public record FretboardPositionDto(
    int PositionNumber,
    int StartFret,
    int EndFret,
    IReadOnlyList<FretboardStringDto> Strings);

public record HarmonizedChordDto(
    string Degree,
    string RootNote,
    string Triad,
    IReadOnlyList<string> TriadNotes,
    string? Seventh,
    IReadOnlyList<string> SeventhNotes);

public record ArpeggioPatternDto(
    string Degree,
    string ChordName,
    string PatternType,
    IReadOnlyList<string> Notes,
    IReadOnlyList<string> Intervals,
    string PracticeHint);

public record PracticeRoutineDto(
    string Title,
    string Focus,
    IReadOnlyList<string> Steps);
