import { Header } from "@/components/Header";
import { SpendVSEarn } from "@/components/SpendVSEarnChart";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";

export default async function Page() {

  const user = await getUser();

  return (
    // This page contains analytics for my personal finances.
    <>
      <Header
        title="Dashboard"
        children={
         <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">Welcome back, {user?.displayName}</h1>
            </div>
            <div className="w-full">
              <section id="charts" className="scroll-mt-20">
                <div className="grid gap-4">
                  <div className="gap-6 md:flex md:flex-row-reverse md:items-start">
                    <div className="grid flex-1 gap-12">
                      <h2 className="sr-only">Examples</h2>
                      <div id="examples" className="grid flex-1 scroll-mt-20 items-start gap-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:gap-10">
                        <div className="themes-wrapper group relative flex flex-col overflow-hidden rounded-xl border shadow transition-all duration-200 ease-in-out hover:z-30">
                          <SpendVSEarn />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        }
      />
    </>
  )
}