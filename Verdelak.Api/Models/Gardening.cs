namespace Verdelak.Api.Models;

public class GardenSeed
{
    public int ID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? PlantDate { get; set; }
    public bool Indoor { get; set; }
    public DateTime? SecondPlantDate { get; set; }
    public string? Notes { get; set; }
}

public class GardenSeedInventory
{
    public int SeedID { get; set; }
    public short Qty { get; set; }
    public bool Reorder { get; set; }
}

public class GardenSeedTray
{
    public int ID { get; set; }
    public string TrayName { get; set; } = string.Empty;
}

public class GardenSeedTrayDimension
{
    public int ID { get; set; }
    public int TrayID { get; set; }
    public short SlotsWide { get; set; }
    public short SlotsDeep { get; set; }
}

public class GardenSeedTrayPlant
{
    public int ID { get; set; }
    public int TrayID { get; set; }
    public int TraySlotID { get; set; }
    public int SeedId { get; set; }
    public short Year { get; set; }
    public DateTime PlantDate { get; set; }
    public bool Success { get; set; }
    public bool Planning { get; set; }
}

public class GardenPlot
{
    public int ID { get; set; }
    public string GardenName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class GardenPlotDimension
{
    public int ID { get; set; }
    public short TraySlotsWide { get; set; }
    public short SlotsDeep { get; set; }
    public string? Notes { get; set; }
}

public class GardenPlotPlant
{
    public int ID { get; set; }
    public int GardenPlotID { get; set; }
    public int TraySlotID { get; set; }
    public int SeedID { get; set; }
    public short Year { get; set; }
    public DateTime? PlantDate { get; set; }
    public bool Success { get; set; }
    public short? Qty { get; set; }
    public bool Planning { get; set; }
}

public class GardenNote
{
    public int ID { get; set; }
    public int GardenPlotID { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
    public short? Year { get; set; }
}
public class GardenHarvest
{
    public int ID { get; set; }
    public int GardenPlotID { get; set; }
    public int SeedID { get; set; }
    public DateTime HarvestDate { get; set; }
    public short? Year { get; set; }
    public decimal? Quantity { get; set; }
    public string? Notes { get; set; }
}

