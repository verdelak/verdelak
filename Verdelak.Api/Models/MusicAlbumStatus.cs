using System.ComponentModel.DataAnnotations.Schema;

namespace Verdelak.Api.Models;

[Table("MusicAlbumStatus")]
public class MusicAlbumStatus
{
    public int ID { get; set; }

    public int AlbumID { get; set; }

    public string FormatID { get; set; } = "CD";

    public string? WantStatusID { get; set; } = "H";

    public MusicAlbum? Album { get; set; }
}
