namespace Verdelak.Api.Models
{
    public class RPGProduct
    {
        public int ID { get; set; }
        public string ProductName { get; set; } = "";
        public string? Description { get; set; }
        public string? ProductNum { get; set; }
        public int? ProductTypeID { get; set; }
        public int? SystemID { get; set; }
        public int? SeriesID { get; set; }
        public string? Status { get; set; } // consider tinyint later
        public string? ISBN { get; set; }
        public string? Edition { get; set; }

        public RPGProductType? ProductType { get; set; }
        public RPGSystem? System { get; set; }
        public RPGSeries? Series { get; set; }
    }

    public class RPGProductType
    {
        public int ID { get; set; }
        public string Type { get; set; } = "";
        public string? Description { get; set; }
        public ICollection<RPGProduct> Products { get; set; } = new List<RPGProduct>();
    }

    public class RPGSystem
    {
        public int ID { get; set; }
        public string Name { get; set; } = "";
        public ICollection<RPGProduct> Products { get; set; } = new List<RPGProduct>();
        public ICollection<RPGSystemNote> Notes { get; set; } = new List<RPGSystemNote>();
    }
    public class RPGSystemNote
    {
        public int ID { get; set; }
        public int RPGSystemID { get; set; }
        public string? Notes { get; set; }
        public RPGSystem System { get; set; } = null!;
    }

    public class RPGSeries
    {
        public int ID { get; set; }
        public string SeriesName { get; set; } = "";
        public ICollection<RPGProduct> Products { get; set; } = new List<RPGProduct>();
        public ICollection<RPGSeriesNote> Notes { get; set; } = new List<RPGSeriesNote>();
    }
    public class RPGSeriesNote
    {
        public int ID { get; set; }
        public int RPGSeriesID { get; set; }
        public string? Notes { get; set; }
        public RPGSeries Series { get; set; } = null!;
    }

}
