import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import {
  Shield,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  Clock,
  MapPin,
} from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

interface LoginRecord {
  _id: string;
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  deviceType: string;
  deviceModel: string;
  ipAddress: string;
  city: string;
  state: string;
  country: string;
  status: string;
  loginTime: string;
}

interface TrustedDevice {
  _id: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  deviceModel: string;
  ipAddress: string;
  city: string;
  state: string;
  country: string;
  expiresAt: string;
}

export default function SecurityPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");

  const [history, setHistory] =
    useState<LoginRecord[]>([]);

  const [devices, setDevices] =
    useState<TrustedDevice[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      const id = user._id || user.id;

      if (id) {
        setUserId(id);
      }
    } catch (error) {
      console.error(
        "Unable to read user:",
        error
      );
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    loadSecurityData();
  }, [userId]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      const [
        historyResponse,
        devicesResponse,
      ] = await Promise.all([
        fetch(
          `${BACKEND_URL}/security/login-history/${userId}`
        ),

        fetch(
          `${BACKEND_URL}/security/trusted-devices/${userId}`
        ),
      ]);

      const historyData =
        await historyResponse.json();

      const devicesData =
        await devicesResponse.json();

      if (historyData.success) {
        setHistory(
          historyData.history || []
        );
      }

      if (devicesData.success) {
        setDevices(
          devicesData.devices || []
        );
      }
    } catch (error) {
      console.error(
        "Security data error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const removeDevice = async (
    deviceId: string
  ) => {
    const confirmed = window.confirm(
      "Remove this trusted device?"
    );

    if (!confirmed) return;

    try {
      const response =
        await fetch(
          `${BACKEND_URL}/security/trusted-devices/${deviceId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (data.success) {
        setDevices((current) =>
          current.filter(
            (device) =>
              device._id !== deviceId
          )
        );
      }
    } catch (error) {
      console.error(
        "Remove device error:",
        error
      );
    }
  };

  const getDeviceIcon = (
    type: string
  ) => {
    if (type === "Mobile") {
      return <Smartphone size={24} />;
    }

    if (type === "Tablet") {
      return <Tablet size={24} />;
    }

    return <Monitor size={24} />;
  };

  if (loading) {
    return (
      <div className="p-8">
        Loading security information...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-full bg-blue-600 p-3 text-white">
            <Shield size={30} />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Account Security
            </h1>

            <p className="text-gray-500">
              Review your login activity and
              trusted devices.
            </p>
          </div>
        </div>

        {/* TRUSTED DEVICES */}

        <section className="mb-8 rounded-xl border p-6">
          <h2 className="mb-5 text-2xl font-semibold">
            Trusted Devices
          </h2>

          {devices.length === 0 ? (
            <p className="text-gray-500">
              No trusted devices found.
            </p>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device._id}
                  className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex gap-4">
                    <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
                      {getDeviceIcon(
                        device.deviceType
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {device.browser}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {device.operatingSystem}
                      </p>

                      <p className="text-sm text-gray-500">
                        {device.deviceType} •{" "}
                        {device.deviceModel}
                      </p>

                      <p className="text-sm text-gray-500">
                        {device.city},{" "}
                        {device.state},{" "}
                        {device.country}
                      </p>

                      <p className="mt-1 text-sm">
                        Trusted until:{" "}
                        {new Date(
                          device.expiresAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      removeDevice(
                        device._id
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    <Trash2 size={18} />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LOGIN HISTORY */}

        <section className="rounded-xl border p-6">
          <div className="mb-5 flex items-center gap-3">
            <Clock size={24} />

            <h2 className="text-2xl font-semibold">
              Login History
            </h2>
          </div>

          {history.length === 0 ? (
            <p className="text-gray-500">
              No login history found.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div
                  key={record._id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">

                    <div>
                      <h3 className="font-semibold">
                        {record.browser}{" "}
                        {record.browserVersion}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {record.operatingSystem}
                      </p>

                      <p className="text-sm text-gray-500">
                        {record.deviceType} •{" "}
                        {record.deviceModel}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <MapPin size={16} />

                        {record.city},{" "}
                        {record.state},{" "}
                        {record.country}
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        IP: {record.ipAddress}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p
                        className={`font-semibold ${
                          record.status ===
                          "success"
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {record.status}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(
                          record.loginTime
                        ).toLocaleString()}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}