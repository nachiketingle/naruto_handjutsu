using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using GoogleARCore;
using GoogleARCore.Examples.ComputerVision;
using GoogleARCore.Examples.Common;
using System;
using UnityEngine.Networking;


public class ScreenCapturer : MonoBehaviour
{

   public Text debugText;
   CameraImageBytes bytes;

   private static byte[] s_ImageBuffer = new byte[0];
   private static int s_ImageBufferSize = 0;


   // Start is called before the first frame update
   void Start()
   {
      debugText.text = "False";

      //TextureReaderComponent.OnImageAvailableCallback += OnImageAvailable;
   }

   // Update is called once per frame
   void Update()
   {
      //bytes = Frame.CameraImage.AcquireCameraImageBytes();
      //debugText.text = bytes.IsAvailable.ToString();
      using (var image = Frame.CameraImage.AcquireCameraImageBytes())
      {
         if (image.IsAvailable)
         {


            // Adjust buffer size if necessary.
            int bufferSize = image.UVRowStride * image.Height;
            if (bufferSize != s_ImageBufferSize || s_ImageBuffer.Length == 0)
            {
               s_ImageBufferSize = bufferSize;
               s_ImageBuffer = new byte[bufferSize];
            }

            // Move raw data into managed buffer.
            System.Runtime.InteropServices.Marshal.Copy(image.Y, s_ImageBuffer, 0, bufferSize);

            StartCoroutine(SendData(image.UVRowStride, image.Height));

            // TODO: Send s_ImageBuffer, UVRowStride, and Height to back end
            // debugText.text = bufferSize.ToString();
            //List<IMultipartFormSection> formData = new List<IMultipartFormSection>();
            //formData.Add(new MultipartFormDataSection("field1=foo&field2=bar"));
            //formData.Add(new MultipartFormFileSection("my file data", "myfile.txt"));


         }
         else
         {
            return;
         }

      }

   }

   IEnumerator SendData(int UVRowStride, int Height) {
      Dictionary<string, string> form = new Dictionary<string, string>();
      form["width"] = UVRowStride.ToString();
      form["height"] = Height.ToString();
      form["image"] = Convert.ToBase64String(s_ImageBuffer);

      //List<IMultipartFormSection> formData = new List<IMultipartFormSection>();
      //formData.Add(new MultipartFormDataSection("width=" + UVRowStride + "&height=" + Height + "&imageByteArray=" + Convert.ToBase64String(s_ImageBuffer)));

      UnityWebRequest www = UnityWebRequest.Post("http://35.236.108.192:5000/test", form);

      yield return www.SendWebRequest();
      if (www.isNetworkError || www.isHttpError)
      {
         debugText.text = (www.error).ToString();
      }
      else
      {
         debugText.text = www.downloadHandler.text;
      }
   }

   private void OnImageAvailable(TextureReaderApi.ImageFormatType format, int width, int height, IntPtr pixelBuffer, int bufferSize) {
      debugText.text = "True";
   }
}
