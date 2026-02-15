// Schema Metadata for Mock Data

export interface ColumnDef {
  name: string;
  type: 'VARCHAR' | 'INTEGER' | 'DOUBLE' | 'DATE' | 'TIMESTAMP' | 'BOOLEAN';
  role: 'dimension' | 'measure' | 'key';
  description?: string;
}

export interface TableDef {
  name: string;
  displayName: string;
  columns: ColumnDef[];
  rowCount: number;
}

export interface RelationshipDef {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  joinType: 'LEFT' | 'INNER';
}

export const mockTables: TableDef[] = [
  {
    name: 'customers',
    displayName: 'Clients',
    rowCount: 100,
    columns: [
      { name: 'id', type: 'VARCHAR', role: 'key', description: 'Identifiant client unique' },
      { name: 'name', type: 'VARCHAR', role: 'dimension', description: 'Nom complet du client' },
      { name: 'email', type: 'VARCHAR', role: 'dimension', description: 'Email du client' },
      { name: 'company', type: 'VARCHAR', role: 'dimension', description: 'Nom de l\'entreprise' },
      { name: 'city', type: 'VARCHAR', role: 'dimension', description: 'Ville' },
      { name: 'country', type: 'VARCHAR', role: 'dimension', description: 'Pays' },
      { name: 'segment', type: 'VARCHAR', role: 'dimension', description: 'Segment client (Enterprise/PME/Startup)' },
      { name: 'created_at', type: 'TIMESTAMP', role: 'dimension', description: 'Date de création du compte' }
    ]
  },
  {
    name: 'products',
    displayName: 'Produits',
    rowCount: 50,
    columns: [
      { name: 'id', type: 'VARCHAR', role: 'key', description: 'Identifiant produit unique' },
      { name: 'name', type: 'VARCHAR', role: 'dimension', description: 'Nom du produit' },
      { name: 'category', type: 'VARCHAR', role: 'dimension', description: 'Catégorie principale' },
      { name: 'subcategory', type: 'VARCHAR', role: 'dimension', description: 'Sous-catégorie' },
      { name: 'unit_price', type: 'DOUBLE', role: 'measure', description: 'Prix unitaire de vente' },
      { name: 'cost_price', type: 'DOUBLE', role: 'measure', description: 'Prix de revient' },
      { name: 'stock_qty', type: 'INTEGER', role: 'measure', description: 'Quantité en stock' }
    ]
  },
  {
    name: 'orders',
    displayName: 'Commandes',
    rowCount: 500,
    columns: [
      { name: 'id', type: 'VARCHAR', role: 'key', description: 'Identifiant commande unique' },
      { name: 'customer_id', type: 'VARCHAR', role: 'key', description: 'Référence client' },
      { name: 'order_date', type: 'TIMESTAMP', role: 'dimension', description: 'Date de la commande' },
      { name: 'status', type: 'VARCHAR', role: 'dimension', description: 'Statut de la commande' },
      { name: 'total_amount', type: 'DOUBLE', role: 'measure', description: 'Montant total TTC' },
      { name: 'discount', type: 'DOUBLE', role: 'measure', description: 'Remise en pourcentage' },
      { name: 'shipping_cost', type: 'DOUBLE', role: 'measure', description: 'Frais de port' }
    ]
  },
  {
    name: 'order_items',
    displayName: 'Lignes de commande',
    rowCount: 1200,
    columns: [
      { name: 'id', type: 'VARCHAR', role: 'key', description: 'Identifiant ligne unique' },
      { name: 'order_id', type: 'VARCHAR', role: 'key', description: 'Référence commande' },
      { name: 'product_id', type: 'VARCHAR', role: 'key', description: 'Référence produit' },
      { name: 'quantity', type: 'INTEGER', role: 'measure', description: 'Quantité commandée' },
      { name: 'unit_price', type: 'DOUBLE', role: 'measure', description: 'Prix unitaire au moment de la commande' },
      { name: 'line_total', type: 'DOUBLE', role: 'measure', description: 'Montant total de la ligne' }
    ]
  }
];

export const mockRelationships: RelationshipDef[] = [
  {
    id: 'rel-1',
    sourceTable: 'orders',
    sourceColumn: 'customer_id',
    targetTable: 'customers',
    targetColumn: 'id',
    joinType: 'LEFT'
  },
  {
    id: 'rel-2',
    sourceTable: 'order_items',
    sourceColumn: 'order_id',
    targetTable: 'orders',
    targetColumn: 'id',
    joinType: 'LEFT'
  },
  {
    id: 'rel-3',
    sourceTable: 'order_items',
    sourceColumn: 'product_id',
    targetTable: 'products',
    targetColumn: 'id',
    joinType: 'LEFT'
  }
];
