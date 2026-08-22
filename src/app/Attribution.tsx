/**
 * Data attribution, required rather than decorative.
 *
 * Trail geometry and points of interest come from OpenStreetMap under ODbL 1.0,
 * which permits commercial use but requires the credit below. Elevation comes
 * from the Copernicus GLO-30 DEM, which carries its own attribution condition.
 *
 * Rendered site-wide from layout.tsx so a future page cannot quietly ship
 * without it.
 */
export default function Attribution() {
  return (
    <footer className="relative z-10 bg-black border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col gap-3 text-xs sm:text-sm text-white/50 font-sans leading-relaxed">
          <p>
            Trail and point-of-interest data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
            >
              OpenStreetMap
            </a>{" "}
            contributors, available under the{" "}
            <a
              href="https://opendatacommons.org/licenses/odbl/1-0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
            >
              Open Database License
            </a>
            .
          </p>

          <p>
            Elevation data from the{" "}
            <a
              href="https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
            >
              Copernicus GLO-30 DEM
            </a>
            . © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018
            provided under COPERNICUS by the European Union and ESA, all rights
            reserved.
          </p>

          <p className="text-white/40 pt-2">
            © {new Date().getFullYear()} ViaHimalaya
          </p>
        </div>
      </div>
    </footer>
  );
}
