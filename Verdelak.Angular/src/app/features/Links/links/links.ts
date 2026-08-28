import { Component, computed, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupedLinkDto, LinksService } from '../links.service';

@Component({
  selector: 'app-links',
  imports: [
    NgIf, NgFor, FormsModule
  ],
  templateUrl: './links.html',
  styleUrl: './links.scss'
})
export class LinksComponent {
  private svc = inject(LinksService);
  readonly groupedLinks = this.svc.groupedLinks;
  readonly selectedTopic = signal('');
  search = signal('');

  readonly filtered = computed(() => {
    return this.groupedLinks().map(group => {
      const topicMatch = !this.selectedTopic() || group.topic === this.selectedTopic();
      if (!topicMatch) return null;

      const filteredSub = group.subTopics
        .map(sub => ({
          subTopic: sub.subTopic,
          links: sub.links.filter(l =>
            l.name.toLowerCase().includes(this.search().toLowerCase())
          )
        }))
        .filter(sub => sub.links.length);

      return filteredSub.length ? { topic: group.topic, subTopics: filteredSub } : null;
    }).filter(Boolean) as GroupedLinkDto[];
  });
}
