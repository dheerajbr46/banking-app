import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly featureTiles = [
    {
      title: 'Easy Access',
      description: 'Instantly view balances, cards, and insights with a single glance.',
      icon: '🔑'
    },
    {
      title: 'Track Spending',
      description: 'Beautiful visualisations and smart nudges keep you on track.',
      icon: '📊'
    },
    {
      title: 'Advanced Security',
      description: 'Biometric sign-in, encrypted vaults, and context-aware alerts.',
      icon: '🔐'
    }
  ];

  readonly quickStats = [
    { label: 'Net worth', value: '$128,540', trend: '+8.4%' },
    { label: 'Monthly spend', value: '$4,210', trend: '-3.2%' },
    { label: 'Savings rate', value: '32%', trend: '+5.0%' }
  ];

  readonly activityLog = [
    { title: 'Card payment • Apple', time: 'Just now', amount: '-$42.90' },
    { title: 'Deposit • Employer', time: 'Today, 09:30', amount: '+$3,250.00' },
    { title: 'Transfer • Investment', time: 'Yesterday', amount: '-$500.00' }
  ];

  ngAfterViewInit(): void {
    const animatedNodes = this.host.nativeElement.querySelectorAll<HTMLElement>('[data-anim]');
    requestAnimationFrame(() => {
      animatedNodes.forEach((node, index) => {
        setTimeout(() => node.classList.add('is-visible'), index * 120);
      });
    });
  }
}
