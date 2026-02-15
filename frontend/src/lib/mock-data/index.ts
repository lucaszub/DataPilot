// Mock Data Tables for DataPilot
// Generated with seeded random for consistency

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  city: string;
  country: string;
  segment: 'Enterprise' | 'PME' | 'Startup';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Logiciel' | 'Materiel' | 'Service' | 'Formation';
  subcategory: string;
  unit_price: number;
  cost_price: number;
  stock_qty: number;
}

export interface Order {
  id: string;
  customer_id: string;
  order_date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'shipped';
  total_amount: number;
  discount: number;
  shipping_cost: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  date(start: Date, end: Date): string {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + this.next() * (endTime - startTime);
    return new Date(randomTime).toISOString();
  }
}

// Mock data generators
function generateMockData() {
  const rng = new SeededRandom(42);

  // French cities
  const cities = [
    'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Nantes',
    'Lille', 'Strasbourg', 'Nice', 'Rennes', 'Montpellier', 'Grenoble',
    'Dijon', 'Angers', 'Reims', 'Le Havre', 'Clermont-Ferrand', 'Toulon'
  ];

  // French first/last names
  const firstNames = [
    'Jean', 'Marie', 'Pierre', 'Sophie', 'Luc', 'Camille', 'Nicolas',
    'Julie', 'Thomas', 'Isabelle', 'Alexandre', 'Nathalie', 'Philippe',
    'Céline', 'Laurent', 'Sandrine', 'Christophe', 'Valérie', 'Michel',
    'Stéphanie', 'François', 'Caroline', 'Olivier', 'Martine', 'David'
  ];

  const lastNames = [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard',
    'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre',
    'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
    'Morel', 'Girard', 'Andre', 'Mercier', 'Dupont'
  ];

  const companyPrefixes = [
    'Solutions', 'Groupe', 'Systemes', 'Technologies', 'Conseil',
    'Services', 'Digital', 'Innovation', 'Entreprise', 'Industries'
  ];

  const companySuffixes = [
    'France', 'Paris', 'Expert', 'Pro', 'Plus', 'Premium',
    'Tech', 'Consulting', 'SARL', 'SAS'
  ];

  // Customers (100)
  const customers: Customer[] = [];
  for (let i = 0; i < 100; i++) {
    const firstName = rng.choice(firstNames);
    const lastName = rng.choice(lastNames);
    const companyName = `${rng.choice(companyPrefixes)} ${rng.choice(companySuffixes)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyName.toLowerCase().replace(/\s/g, '')}.fr`;
    const segments: Array<'Enterprise' | 'PME' | 'Startup'> = ['Enterprise', 'PME', 'Startup'];
    const segmentWeights = [0.3, 0.5, 0.2]; // 30% Enterprise, 50% PME, 20% Startup
    let segment: 'Enterprise' | 'PME' | 'Startup';
    const r = rng.next();
    if (r < segmentWeights[0]) {
      segment = 'Enterprise';
    } else if (r < segmentWeights[0] + segmentWeights[1]) {
      segment = 'PME';
    } else {
      segment = 'Startup';
    }

    customers.push({
      id: `CUST-${String(i + 1).padStart(4, '0')}`,
      name: `${firstName} ${lastName}`,
      email,
      company: companyName,
      city: rng.choice(cities),
      country: 'France',
      segment,
      created_at: rng.date(new Date('2020-01-01'), new Date('2025-12-31'))
    });
  }

  // Products (50)
  const productData = {
    Logiciel: {
      subcategories: ['ERP', 'CRM', 'Comptabilite', 'Gestion RH', 'Business Intelligence'],
      names: [
        'Module ERP Entreprise', 'Suite CRM Pro', 'Logiciel Comptabilite Premium',
        'Plateforme RH Cloud', 'DataPilot BI Suite', 'Module Paie Advanced',
        'CRM Mobile Edition', 'ERP PME Starter', 'Comptabilite Express',
        'RH Analytics Pro', 'BI Dashboard Builder', 'Module Stock ERP'
      ],
      priceRange: [500, 15000]
    },
    Materiel: {
      subcategories: ['Ordinateurs', 'Serveurs', 'Reseaux', 'Peripheriques', 'Stockage'],
      names: [
        'Laptop Pro 15"', 'Serveur Rack 2U', 'Switch Gigabit 48 ports',
        'Imprimante Laser Couleur', 'NAS 4 baies', 'PC Bureau i7',
        'Ecran 27" 4K', 'Firewall Enterprise', 'Disque SSD 2To',
        'Serveur Tour', 'Switch PoE 24 ports', 'Webcam HD Pro'
      ],
      priceRange: [150, 8000]
    },
    Service: {
      subcategories: ['Conseil', 'Integration', 'Support', 'Audit', 'Infogérance'],
      names: [
        'Conseil Transformation Digitale', 'Integration ERP sur mesure',
        'Support Premium 24/7', 'Audit Securite IT', 'Infogerance Cloud',
        'Conseil Strategie Data', 'Integration CRM Custom', 'Support Standard',
        'Audit Performance', 'Maintenance Applicative', 'Conseil Agile'
      ],
      priceRange: [1000, 25000]
    },
    Formation: {
      subcategories: ['Technique', 'Management', 'Utilisateur', 'Certification', 'E-learning'],
      names: [
        'Formation Python Avance', 'Management Agile Scrum',
        'Formation Utilisateur ERP', 'Certification AWS Cloud',
        'E-learning Cybersecurite', 'Formation React TypeScript',
        'Leadership Digital', 'Formation Excel Avance', 'Certification PMP',
        'E-learning Data Science', 'Formation Docker Kubernetes'
      ],
      priceRange: [300, 5000]
    }
  };

  const products: Product[] = [];
  let productId = 1;
  for (const [category, data] of Object.entries(productData)) {
    const numProducts = category === 'Logiciel' ? 15 : 12;
    for (let i = 0; i < numProducts && productId <= 50; i++) {
      const subcategory = rng.choice(data.subcategories);
      const name = rng.choice(data.names);
      const unitPrice = rng.nextInt(data.priceRange[0], data.priceRange[1]);
      const costPrice = Math.round(unitPrice * (0.4 + rng.next() * 0.3)); // 40-70% cost
      const stockQty = category === 'Service' || category === 'Formation'
        ? 0
        : rng.nextInt(5, 200);

      products.push({
        id: `PROD-${String(productId).padStart(4, '0')}`,
        name,
        category: category as 'Logiciel' | 'Materiel' | 'Service' | 'Formation',
        subcategory,
        unit_price: unitPrice,
        cost_price: costPrice,
        stock_qty: stockQty
      });
      productId++;
    }
  }

  // Orders (500)
  const orders: Order[] = [];
  const statuses: Array<'completed' | 'pending' | 'cancelled' | 'shipped'> = [
    'completed', 'pending', 'cancelled', 'shipped'
  ];
  const statusWeights = [0.7, 0.15, 0.05, 0.1]; // 70% completed, 15% pending, 5% cancelled, 10% shipped

  for (let i = 0; i < 500; i++) {
    const customerId = rng.choice(customers).id;
    const orderDate = rng.date(new Date('2024-01-01'), new Date('2026-02-14'));

    let status: 'completed' | 'pending' | 'cancelled' | 'shipped';
    const r = rng.next();
    if (r < statusWeights[0]) {
      status = 'completed';
    } else if (r < statusWeights[0] + statusWeights[1]) {
      status = 'pending';
    } else if (r < statusWeights[0] + statusWeights[1] + statusWeights[2]) {
      status = 'cancelled';
    } else {
      status = 'shipped';
    }

    const discount = rng.next() < 0.3 ? rng.nextInt(5, 20) : 0; // 30% have discount
    const shippingCost = rng.nextInt(0, 150);

    orders.push({
      id: `ORD-${String(i + 1).padStart(5, '0')}`,
      customer_id: customerId,
      order_date: orderDate,
      status,
      total_amount: 0, // Will be calculated from order items
      discount,
      shipping_cost: shippingCost
    });
  }

  // Order Items (1200)
  const orderItems: OrderItem[] = [];
  let itemId = 1;

  for (const order of orders) {
    const numItems = rng.nextInt(1, 5); // 1-5 items per order
    const selectedProducts = rng.shuffle(products).slice(0, numItems);

    let orderTotal = 0;
    for (const product of selectedProducts) {
      const quantity = rng.nextInt(1, 10);
      const unitPrice = product.unit_price;
      const lineTotal = quantity * unitPrice;
      orderTotal += lineTotal;

      orderItems.push({
        id: `ITEM-${String(itemId).padStart(5, '0')}`,
        order_id: order.id,
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal
      });
      itemId++;
    }

    // Update order total_amount with discount
    order.total_amount = Math.round(orderTotal * (1 - order.discount / 100) + order.shipping_cost);
  }

  return { customers, products, orders, orderItems };
}

// Generate and export data
const mockData = generateMockData();

export const customers = mockData.customers;
export const products = mockData.products;
export const orders = mockData.orders;
export const orderItems = mockData.orderItems;
