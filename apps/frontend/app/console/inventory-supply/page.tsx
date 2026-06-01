const productRows = [
  {
    name: "Latte 16oz",
    sku: "COF-LAT-16",
    category: "Beverage",
    price: "$105.00",
    vat: "12%",
    barcode: "4800010110034",
    status: "Active",
  },
  {
    name: "Blueberry Muffin",
    sku: "BAK-MUF-07",
    category: "Bakery",
    price: "$85.00",
    vat: "12%",
    barcode: "4800010210722",
    status: "Active",
  },
  {
    name: "Bottled Water 500ml",
    sku: "BEV-WAT-05",
    category: "Beverage",
    price: "$35.00",
    vat: "12%",
    barcode: "4800010312100",
    status: "Inactive",
  },
];

const categoryRows = [
  { name: "Beverage", sort: 1, products: 35 },
  { name: "Bakery", sort: 2, products: 12 },
  { name: "Merchandise", sort: 3, products: 18 },
];

const stockRows = [
  { store: "Store 01", sku: "COF-LAT-16", onHand: 58, reorder: 40, alert: "Normal" },
  { store: "Store 02", sku: "BAK-MUF-07", onHand: 11, reorder: 20, alert: "Low stock" },
  { store: "Store 03", sku: "BEV-WAT-05", onHand: 4, reorder: 15, alert: "Critical" },
];

const movementRows = [
  { date: "2026-06-01", sku: "COF-LAT-16", type: "Adjustment", qty: "+12", by: "Warehouse Ops" },
  { date: "2026-06-01", sku: "BAK-MUF-07", type: "Transfer", qty: "-8", by: "Store 02" },
  { date: "2026-05-31", sku: "BEV-WAT-05", type: "Receiving", qty: "+120", by: "Store 03" },
];

const procurementRows = [
  {
    supplier: "North Bean Supplies",
    po: "PO-12093",
    status: "For receiving",
    eta: "2026-06-02",
  },
  {
    supplier: "Bakery Partners Co.",
    po: "PO-12089",
    status: "Partially received",
    eta: "2026-06-01",
  },
  {
    supplier: "Aqua Distribution",
    po: "PO-12071",
    status: "Draft",
    eta: "2026-06-04",
  },
];

const warehouseRows = [
  {
    batch: "BAT-20260601-18",
    dispatch: "DSP-3011",
    transfer: "TRN-889",
    destination: "Store 02",
    status: "In transit",
  },
  {
    batch: "BAT-20260531-07",
    dispatch: "DSP-3009",
    transfer: "TRN-884",
    destination: "Store 01",
    status: "Received",
  },
  {
    batch: "BAT-20260530-03",
    dispatch: "DSP-3008",
    transfer: "TRN-876",
    destination: "Store 03",
    status: "Pending pick",
  },
];

export default function InventorySupplyPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
          Inventory & Supply
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Catalog, stock, and procurement operations
        </h2>
      </header>

      <section id="product-catalog" className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Product catalog CRUD</h3>
        <div className="grid gap-3 rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Product name"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="text"
            placeholder="SKU"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="text"
            placeholder="Category"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="number"
            placeholder="Price"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="text"
            placeholder="VAT"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="text"
            placeholder="Barcode"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <select className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-primary px-5 text-sm font-semibold text-on-primary transition duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Save product
          </button>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface-raised p-4 sm:p-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">SKU</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">VAT</th>
                <th className="py-3 pr-4">Barcode</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((product) => (
                <tr key={product.sku} className="border-b border-border/70">
                  <td className="py-3 pr-4 font-semibold text-foreground">{product.name}</td>
                  <td className="py-3 pr-4 text-foreground/75">{product.sku}</td>
                  <td className="py-3 pr-4 text-foreground/75">{product.category}</td>
                  <td className="py-3 pr-4 text-foreground/75">{product.price}</td>
                  <td className="py-3 pr-4 text-foreground/75">{product.vat}</td>
                  <td className="py-3 pr-4 text-foreground/75">{product.barcode}</td>
                  <td className="py-3 pr-4 text-foreground/75">{product.status}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Category CRUD</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_140px]">
            <input
              type="text"
              placeholder="Category name"
              className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <input
              type="number"
              placeholder="Sort order"
              className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-primary px-5 text-sm font-semibold text-on-primary transition duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              Save
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Sort</th>
                  <th className="py-3 pr-4">Products</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((category) => (
                  <tr key={category.name} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-semibold text-foreground">{category.name}</td>
                    <td className="py-3 pr-4 text-foreground/75">{category.sort}</td>
                    <td className="py-3 pr-4 text-foreground/75">{category.products}</td>
                    <td className="py-3 text-right text-foreground/75">Edit / Delete</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Stock levels per store</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Includes low-stock alerts per SKU and reorder threshold.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Store</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4">On hand</th>
                  <th className="py-3 pr-4">Reorder</th>
                  <th className="py-3 text-right">Alert</th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((stock) => (
                  <tr key={`${stock.store}-${stock.sku}`} className="border-b border-border/70">
                    <td className="py-3 pr-4 text-foreground">{stock.store}</td>
                    <td className="py-3 pr-4 font-semibold text-foreground">{stock.sku}</td>
                    <td className="py-3 pr-4 text-foreground/75">{stock.onHand}</td>
                    <td className="py-3 pr-4 text-foreground/75">{stock.reorder}</td>
                    <td className="py-3 text-right font-semibold text-secondary">
                      {stock.alert}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">
          Inventory adjustments and movement logs
        </h3>
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface-raised p-4 sm:p-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">SKU</th>
                <th className="py-3 pr-4">Movement type</th>
                <th className="py-3 pr-4">Qty</th>
                <th className="py-3 text-right">Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {movementRows.map((movement) => (
                <tr key={`${movement.date}-${movement.sku}-${movement.type}`} className="border-b border-border/70">
                  <td className="py-3 pr-4 text-foreground/75">{movement.date}</td>
                  <td className="py-3 pr-4 font-semibold text-foreground">{movement.sku}</td>
                  <td className="py-3 pr-4 text-foreground/75">{movement.type}</td>
                  <td className="py-3 pr-4 font-semibold text-secondary">{movement.qty}</td>
                  <td className="py-3 text-right text-foreground/75">{movement.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Procurement flow</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Suppliers, purchase orders, and receiving checkpoints.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Supplier</th>
                  <th className="py-3 pr-4">PO</th>
                  <th className="py-3 pr-4">ETA</th>
                  <th className="py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {procurementRows.map((procurement) => (
                  <tr key={procurement.po} className="border-b border-border/70">
                    <td className="py-3 pr-4 text-foreground">{procurement.supplier}</td>
                    <td className="py-3 pr-4 font-semibold text-foreground">{procurement.po}</td>
                    <td className="py-3 pr-4 text-foreground/75">{procurement.eta}</td>
                    <td className="py-3 text-right font-semibold text-secondary">
                      {procurement.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Warehouse flow</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Batch control with dispatches and transfers across stores.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Batch</th>
                  <th className="py-3 pr-4">Dispatch</th>
                  <th className="py-3 pr-4">Transfer</th>
                  <th className="py-3 pr-4">Destination</th>
                  <th className="py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouseRows.map((warehouse) => (
                  <tr key={warehouse.transfer} className="border-b border-border/70">
                    <td className="py-3 pr-4 text-foreground">{warehouse.batch}</td>
                    <td className="py-3 pr-4 text-foreground/75">{warehouse.dispatch}</td>
                    <td className="py-3 pr-4 font-semibold text-foreground">
                      {warehouse.transfer}
                    </td>
                    <td className="py-3 pr-4 text-foreground/75">{warehouse.destination}</td>
                    <td className="py-3 text-right font-semibold text-secondary">
                      {warehouse.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
