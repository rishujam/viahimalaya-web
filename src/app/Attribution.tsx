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

          {/*
            Verbatim from the Copernicus DEM licence, Article 6(b) — the notice
            for data that has been "adapted or modified". Our elevation profiles
            are resampled at 100 m from the source grid, so 6(a)'s unmodified
            wording does not apply. Article 6(c) then requires the liability
            sentence below, word for word. Do not paraphrase either.
          */}
          <p>
            Elevation data:{" "}
            <a
              href="https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
            >
              produced using Copernicus WorldDEM-30
            </a>{" "}
            © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018
            provided under COPERNICUS by the European Union and ESA; all rights
            reserved.
          </p>

          <p>
            The organisations in charge of the Copernicus programme by law or by
            delegation do not incur any liability for any use of the Copernicus
            WorldDEM-30.
          </p>

          <p className="text-white/40 pt-2">
            © {new Date().getFullYear()} ViaHimalaya
          </p>
        </div>
      </div>
    </footer>
  );
}
