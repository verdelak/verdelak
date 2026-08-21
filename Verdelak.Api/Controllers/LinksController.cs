using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    public class LinksController : Controller
    {
        private readonly VerdelakDbContext _context;

        public LinksController(VerdelakDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Route("api/links")]
        public async Task<ActionResult<IEnumerable<LinkDto>>> GetLinks()
        {
            var links = await _context.Links
                .Include(l => l.Topic)
                .Include(l => l.SubTopic)
                .Select(link => new LinkDto
                {
                    Id = link.ID,
                    Name = link.Name,
                    Url = link.URL,
                    VerificationDate = link.VerificationDate,
                    Topic = link.Topic != null ? link.Topic.Topic : null,
                    SubTopic = link.SubTopic != null ? link.SubTopic.SubTopic : null
                })
                .ToListAsync();

            return Ok(links);
        }

        [HttpGet("api/links/grouped")]
        public async Task<ActionResult<IEnumerable<GroupedLinkDto>>> GetGroupedLinks()
        {
            var links = await _context.Links
                .Include(l => l.Topic)
                .Include(l => l.SubTopic)
                .ToListAsync();

            var grouped = links
                .GroupBy(l => l.Topic?.Topic ?? "Uncategorized")
                .Select(topicGroup => new GroupedLinkDto
                {
                    Topic = topicGroup.Key,
                    SubTopics = topicGroup
                        .GroupBy(l => l.SubTopic?.SubTopic ?? "General")
                        .Select(subGroup => new SubTopicGroupDto
                        {
                            SubTopic = subGroup.Key,
                            Links = subGroup.Select(link => new LinkItemDto
                            {
                                Id = link.ID,
                                Name = link.Name,
                                Url = link.URL,
                                VerificationDate = link.VerificationDate
                            }).ToList()
                        }).ToList()
                })
                .OrderBy(g => g.Topic)
                .ToList();

            return Ok(grouped);
        }

    }
}
